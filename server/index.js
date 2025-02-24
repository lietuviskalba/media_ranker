// server/index.js
require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sharp = require("sharp"); // For image compression
const pool = require("./db");
const NodeCache = require("node-cache");
const net = require("net");

// Create caches: one for URL statuses (10 minutes TTL) and one for search queries (1 second TTL)
const urlCache = new NodeCache({ stdTTL: 600 });
const searchCache = new NodeCache({ stdTTL: 1 });

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET; // Use a secure key in production

// Function to check if a port is already in use
const portInUse = (port) => {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(true);
        } else {
          reject(err);
        }
      })
      .once("listening", () => {
        tester
          .once("close", () => {
            resolve(false);
          })
          .close();
      })
      .listen(port);
  });
};

app.use(helmet());
app.use(
  cors({
    origin: "https://lingaitis.com/media_ranker",
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

/* 
  Middleware to authenticate requests using JWT.
  The token is expected in the Authorization header as "Bearer <token>".
*/
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expected format: "Bearer <token>"
  if (!token) return res.sendStatus(401); // Unauthorized if no token provided
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden if token invalid
    req.user = user;
    next();
  });
}

/*
  Login endpoint:
  Validates and sanitizes input, then compares provided credentials (with bcrypt) against stored ones.
  Returns a JWT on success.
*/
app.post(
  "/api/login",
  [
    body("username").notEmpty().trim().escape(),
    body("password").notEmpty().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    const storedUsername = process.env.ADMIN_USERNAME;
    const storedHashedPassword = process.env.ADMIN_PASSWORD_HASH;

    if (username !== storedUsername) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });
  }
);

/*
  GET /api/media_records:
  Public endpoint returning all media records sorted by the most recent (using updated_at if available).
*/
app.get("/api/media_records", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM media_records ORDER BY COALESCE(updated_at, date_added) DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching media_records:", err);
    res.status(500).json({ error: "Error fetching media_records" });
  }
});

/*
  GET /api/url-status:
  Accepts a query parameter "url". Uses a HEAD request to get the status code of the URL.
  The result is cached for 10 minutes to avoid redundant network requests.
*/
app.get("/api/url-status", async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "URL query parameter is required" });
  }
  const cachedStatus = urlCache.get(url);
  if (cachedStatus) {
    return res.json({ url, status: cachedStatus, cached: true });
  }
  try {
    const response = await fetch(url, { method: "HEAD" });
    const status = response.status;
    urlCache.set(url, status);
    res.json({ url, status, cached: false });
  } catch (error) {
    console.error("Error fetching URL status:", error);
    res.status(500).json({ error: "Error fetching URL status" });
  }
});

/*
  GET /api/search:
  Accepts a query parameter "q" and searches media_records by title (case-insensitive).
  Results are cached for 1 second to debounce rapid search requests.
*/
app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }
  const cacheKey = `search:${q}`;
  const cachedResult = searchCache.get(cacheKey);
  if (cachedResult) {
    return res.json(cachedResult);
  }
  try {
    const result = await pool.query(
      "SELECT * FROM media_records WHERE title ILIKE $1 ORDER BY COALESCE(updated_at, date_added) DESC",
      [`%${q}%`]
    );
    searchCache.set(cacheKey, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("Error performing search:", err);
    res.status(500).json({ error: "Error performing search" });
  }
});

// Public endpoint to update only the watched_status field (and updated_at timestamp)
// No authentication is required here, so that the ranking page can update the status.
app.put("/api/public/media_records/:id", async (req, res) => {
  const recordId = req.params.id;
  const { watched_status } = req.body;

  if (!watched_status) {
    return res.status(400).json({ error: "watched_status is required" });
  }

  const updated_at = new Date().toISOString();

  try {
    const query = `
      UPDATE media_records
      SET watched_status = $1,
          updated_at = $2
      WHERE id = $3
      RETURNING *
    `;
    const values = [watched_status, updated_at, recordId];
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating record:", err);
    res.status(500).json({ error: "Error updating record" });
  }
});

/*
  POST /api/media_records:
  Protected route to add a new record.
  Validates/sanitizes inputs and compresses the image (if provided) with Sharp.
*/
app.post(
  "/api/media_records",
  authenticateToken,
  [
    body("title").notEmpty().withMessage("Title is required").trim().escape(),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .trim()
      .escape(),
    body("type").notEmpty().withMessage("Type is required").trim().escape(),
    body("watched_status")
      .notEmpty()
      .withMessage("Watched status is required")
      .trim()
      .escape(),
    body("release_year")
      .isNumeric()
      .withMessage("Release year must be a number"),
    body("length_or_episodes")
      .isNumeric()
      .withMessage("Length or episodes must be a number"),
    body("synopsis")
      .notEmpty()
      .withMessage("Synopsis is required")
      .trim()
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let {
      title,
      category,
      type,
      watched_status,
      recommendations,
      release_year,
      length_or_episodes,
      synopsis,
      image,
      comment,
    } = req.body;

    // If an image is provided, compress it using Sharp
    if (image) {
      try {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let imageBuffer;
        if (matches && matches.length === 3) {
          imageBuffer = Buffer.from(matches[2], "base64");
        } else {
          imageBuffer = Buffer.from(image, "base64");
        }
        const compressedBuffer = await sharp(imageBuffer)
          .resize(500)
          .toFormat("jpeg", { quality: 80 })
          .toBuffer();
        image = "data:image/jpeg;base64," + compressedBuffer.toString("base64");
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }

    const id = uuidv4();
    const date_added = new Date().toISOString();

    try {
      const query = `
        INSERT INTO media_records 
          (id, title, category, type, watched_status, recommendations, release_year, length_or_episodes, synopsis, image, comment, date_added)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const values = [
        id,
        title,
        category,
        type,
        watched_status,
        recommendations || "",
        release_year,
        length_or_episodes,
        synopsis,
        image || null,
        comment || "",
        date_added,
      ];
      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error inserting record:", err);
      res.status(500).json({ error: "Error inserting record" });
    }
  }
);

/*
  PUT /api/media_records/:id:
  Protected route to update an existing record.
  Validates/sanitizes inputs and compresses the image (if provided).
*/
app.put(
  "/api/media_records/:id",
  authenticateToken,
  [
    body("title").notEmpty().withMessage("Title is required").trim().escape(),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .trim()
      .escape(),
    body("type").notEmpty().withMessage("Type is required").trim().escape(),
    body("watched_status")
      .notEmpty()
      .withMessage("Watched status is required")
      .trim()
      .escape(),
    body("release_year")
      .isNumeric()
      .withMessage("Release year must be a number"),
    body("length_or_episodes")
      .isNumeric()
      .withMessage("Length or episodes must be a number"),
    body("synopsis")
      .notEmpty()
      .withMessage("Synopsis is required")
      .trim()
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const recordId = req.params.id;
    let {
      title,
      category,
      type,
      watched_status,
      recommendations,
      release_year,
      length_or_episodes,
      synopsis,
      image,
      comment,
    } = req.body;

    // Compress image if provided
    if (image) {
      try {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let imageBuffer;
        if (matches && matches.length === 3) {
          imageBuffer = Buffer.from(matches[2], "base64");
        } else {
          imageBuffer = Buffer.from(image, "base64");
        }
        const compressedBuffer = await sharp(imageBuffer)
          .resize(500)
          .toFormat("jpeg", { quality: 80 })
          .toBuffer();
        image = "data:image/jpeg;base64," + compressedBuffer.toString("base64");
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }

    try {
      const query = `
        UPDATE media_records
        SET title = $1,
            category = $2,
            type = $3,
            watched_status = $4,
            recommendations = $5,
            release_year = $6,
            length_or_episodes = $7,
            synopsis = $8,
            image = $9,
            comment = $10,
            updated_at = $11
        WHERE id = $12
        RETURNING *
      `;
      const values = [
        title,
        category,
        type,
        watched_status,
        recommendations || "",
        release_year,
        length_or_episodes,
        synopsis,
        image || null,
        comment || "",
        new Date().toISOString(),
        recordId,
      ];
      const result = await pool.query(query, values);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error updating record:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

/*
  DELETE /api/media_records/:id:
  Protected route to delete a record.
*/
app.delete("/api/media_records/:id", authenticateToken, async (req, res) => {
  const recordId = req.params.id;
  try {
    const query = `DELETE FROM media_records WHERE id = $1`;
    const result = await pool.query(query, [recordId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ error: "Error deleting record" });
  }
});

/* 
  Start the server only once using the portInUse check.
  This prevents duplicate app.listen calls which cause EADDRINUSE errors.
*/
portInUse(PORT).then((inUse) => {
  if (inUse) {
    console.error(`Port ${PORT} is already in use!`);
    process.exit(1);
  } else {
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  }
});
