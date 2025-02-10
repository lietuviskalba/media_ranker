// server/index.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON (if you later add POST/PUT endpoints)
app.use(express.json());

/**
 * GET /api/records
 * This endpoint reads the data.json file and returns its contents as JSON.
 */
app.get("/api/records", (req, res) => {
  const dataPath = path.join(__dirname, "data.json");
  fs.readFile(dataPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading data file:", err);
      return res.status(500).json({ error: "Error reading data file" });
    }
    try {
      const records = JSON.parse(data);
      res.json(records);
    } catch (parseErr) {
      console.error("Error parsing JSON data:", parseErr);
      res.status(500).json({ error: "Error parsing JSON data" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
