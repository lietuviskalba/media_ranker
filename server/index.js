// server/index.js
require("dotenv").config({ path: "./.env" });
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sharp = require("sharp");
const pool = require("./db");
const NodeCache = require("node-cache");
const net = require("net");
const path = require("path");

// Create caches (TTL in seconds)
const urlCache = new NodeCache({ stdTTL: 600 });
const searchCache = new NodeCache({ stdTTL: 1 });

const app = express();
const PORT = process.env.PORT || 5002;
const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is set in .env

// Increase JSON body limit (e.g., for image uploads)
app.use(express.json({ limit: "5mb" }));

// Set up Helmet and CORS
app.use(helmet());
app.use(
  cors({
    origin: "https://lingaitis.com/media_ranker",
    optionsSuccessStatus: 200,
  })
);

// -----------------------
// API Endpoints (Routes)
// -----------------------

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Login endpoint
app.post(
  "/api/login",
  [
    body("username").notEmpty().trim().escape(),
    body("password").notEmpty().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    const storedUsername = process.env.ADMIN_USERNAME;
    const storedHashedPassword = process.env.ADMIN_PASSWORD_HASH;

    if (username !== storedUsername)
      return res.status(401).json({ error: "Invalid credentials" });

    const passwordMatch = await bcrypt.compare(password, storedHashedPassword);
    if (!passwordMatch)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });
  }
);

// Public endpoint: Get all media records
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

// GET URL status with caching
app.get("/api/url-status", async (req, res) => {
  const url = req.query.url;
  if (!url)
    return res.status(400).json({ error: "URL query parameter is required" });

  const cachedStatus = urlCache.get(url);
  if (cachedStatus)
    return res.json({ url, status: cachedStatus, cached: true });

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

// Search endpoint with debouncing via cache
app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  if (!q)
    return res.status(400).json({ error: "Query parameter 'q' is required" });

  const cacheKey = `search:${q}`;
  const cachedResult = searchCache.get(cacheKey);
  if (cachedResult) return res.json(cachedResult);

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

// Public update endpoint for ranking page (update watched_status)
app.put("/api/public/media_records/:id", async (req, res) => {
  const recordId = req.params.id;
  const { watched_status } = req.body;
  if (!watched_status)
    return res.status(400).json({ error: "watched_status is required" });

  const updated_at = new Date().toISOString();
  try {
    const query = `
      UPDATE media_records
      SET watched_status = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `;
    const values = [watched_status, updated_at, recordId];
    const result = await pool.query(query, values);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Record not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating record:", err);
    res.status(500).json({ error: "Error updating record" });
  }
});

// Protected endpoint: Add new record (with validation, sanitization, and image compression)
app.post(
  "/api/media_records",
  authenticateToken,
  [
    // Only title is required; other fields are optional.
    body("title").notEmpty().withMessage("Title is required").trim().escape(),
    body("category").optional({ checkFalsy: true }).trim().escape(),
    body("type").optional({ checkFalsy: true }).trim().escape(),
    body("watched_status").optional({ checkFalsy: true }).trim().escape(),
    body("release_year")
      .optional({ checkFalsy: true })
      .isNumeric()
      .withMessage("Release year must be a number"),
    body("length_or_episodes")
      .optional({ checkFalsy: true })
      .isNumeric()
      .withMessage("Length or episodes must be a number"),
    body("synopsis").optional({ checkFalsy: true }).trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Destructure with default values
    let {
      title,
      category = "",
      type = "",
      watched_status = "",
      recommendations = "",
      release_year = 0,
      length_or_episodes = 0,
      synopsis = "",
      image,
      comment = "",
    } = req.body;

    // Convert numeric fields
    release_year = Number(release_year);
    length_or_episodes = Number(length_or_episodes);

    const id = uuidv4();
    const date_added = new Date().toISOString();

    // (Image compression code remains unchanged)
    if (image) {
      try {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const imageBuffer =
          matches && matches.length === 3
            ? Buffer.from(matches[2], "base64")
            : Buffer.from(image, "base64");
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
        recommendations,
        release_year,
        length_or_episodes,
        synopsis,
        image || null,
        comment,
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

// Protected endpoint: Update existing record (with optional fields, sanitization, and image compression)
app.put(
  "/api/media_records/:id",
  authenticateToken,
  [
    body("title").notEmpty().withMessage("Title is required").trim().escape(),
    body("category").optional({ checkFalsy: true }).trim().escape(),
    body("type").optional({ checkFalsy: true }).trim().escape(),
    body("watched_status").optional({ checkFalsy: true }).trim().escape(),
    body("release_year")
      .optional({ checkFalsy: true })
      .isNumeric()
      .withMessage("Release year must be a number"),
    body("length_or_episodes")
      .optional({ checkFalsy: true })
      .isNumeric()
      .withMessage("Length or episodes must be a number"),
    body("synopsis").optional({ checkFalsy: true }).trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const recordId = req.params.id;
    // Destructure with defaults if missing
    let {
      title,
      category = "",
      type = "",
      watched_status = "",
      recommendations = "",
      release_year = 0,
      length_or_episodes = 0,
      synopsis = "",
      image,
      comment = "",
    } = req.body;

    // Convert numeric fields
    release_year = Number(release_year);
    length_or_episodes = Number(length_or_episodes);

    // If an image is provided, compress it using Sharp
    if (image) {
      try {
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const imageBuffer =
          matches && matches.length === 3
            ? Buffer.from(matches[2], "base64")
            : Buffer.from(image, "base64");
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
        recommendations,
        release_year,
        length_or_episodes,
        synopsis,
        image || null,
        comment,
        new Date().toISOString(),
        recordId,
      ];
      const result = await pool.query(query, values);
      if (result.rowCount === 0)
        return res.status(404).json({ error: "Record not found" });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error updating record:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Protected endpoint: Delete a record
app.delete("/api/media_records/:id", authenticateToken, async (req, res) => {
  const recordId = req.params.id;
  try {
    const query = `DELETE FROM media_records WHERE id = $1`;
    const result = await pool.query(query, [recordId]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ error: "Error deleting record" });
  }
});

// -------------------------
// Static File Serving
// -------------------------
// Serve static files from the React app's build directory
app.use(express.static(path.join(__dirname, "../client/build")));

// Catch-all route: for any route not handled above, serve index.html from the build folder
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// ------------------------------------
// Utility: Check if a port is in use
// ------------------------------------
const portInUse = (port) =>
  new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once("error", (err) => {
        if (err.code === "EADDRINUSE") resolve(true);
        else reject(err);
      })
      .once("listening", () => {
        tester.once("close", () => resolve(false)).close();
      })
      .listen(port);
  });

// Start the server only if the port is free
portInUse(PORT).then((inUse) => {
  if (inUse) {
    console.error(`Port ${PORT} is already in use!`);
    process.exit(1);
  } else {
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  }
});
