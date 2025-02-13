// server/index.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// GET /api/records - Return all records
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

// POST /api/records - Add a new record (for the admin page)
app.post("/api/records", (req, res) => {
  const { name, type, image } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "Name and type are required." });
  }

  const newRecord = {
    id: uuidv4(), // Generates a unique ID
    name,
    type,
    dateAdded: new Date().toISOString(), // Current date/time in ISO format
  };

  // Optionally add image data if provided
  if (image) {
    newRecord.image = image;
  }

  const dataPath = path.join(__dirname, "data.json");

  // Read the existing records
  fs.readFile(dataPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading data file:", err);
      return res.status(500).json({ error: "Error reading data file" });
    }
    let records = [];
    try {
      records = JSON.parse(data);
    } catch (parseErr) {
      console.error("Error parsing JSON data:", parseErr);
      return res.status(500).json({ error: "Error parsing JSON data" });
    }

    records.push(newRecord);

    // Write back the updated records
    fs.writeFile(dataPath, JSON.stringify(records, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing to data file:", writeErr);
        return res.status(500).json({ error: "Error writing to data file" });
      }
      res.status(201).json(newRecord);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
