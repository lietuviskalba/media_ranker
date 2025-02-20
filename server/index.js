// server/index.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(
  cors({
    origin: "https://lingaitis.com/media_ranker",
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

// GET /api/media_records - Return all media_records
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

// POST /api/media_records - Add a new record with validation
app.post(
  "/api/media_records",
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
    body("synopsis").notEmpty().withMessage("Synopsis is required").trim(),
    // image and comment are optional
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
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

    const id = uuidv4();
    const date_added = new Date().toISOString();

    try {
      const query = `
      INSERT INTO media_records (id, title, category, type, watched_status, recommendations, release_year, length_or_episodes, synopsis, image, comment, date_added)
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

// PUT /api/media_records/:id - Update a record with validation
app.put(
  "/api/media_records/:id",
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
    body("synopsis").notEmpty().withMessage("Synopsis is required").trim(),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const recordId = req.params.id;
    const updatedData = req.body;

    const {
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
    } = updatedData;

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

// DELETE /api/media_records/:id - Delete a record
app.delete("/api/media_records/:id", async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
