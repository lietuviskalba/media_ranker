// server/index.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const dataPath = path.join(__dirname, "data.json");

// GET /api/records - Return all records
app.get("/api/records", (req, res) => {
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

// POST /api/records - Add a new record
app.post("/api/records", (req, res) => {
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
  } = req.body;

  // Validate required fields
  const missingFields = [];
  if (!title) missingFields.push("title");
  if (!category) missingFields.push("category");
  if (!type) missingFields.push("type");
  if (!watched_status) missingFields.push("watched_status");
  if (release_year === undefined || release_year === null)
    missingFields.push("release_year");
  if (length_or_episodes === undefined || length_or_episodes === null)
    missingFields.push("length_or_episodes");
  if (!synopsis) missingFields.push("synopsis");

  if (missingFields.length > 0) {
    console.error("Missing required fields:", missingFields.join(", "));
    return res
      .status(400)
      .json({ error: `Missing required fields: ${missingFields.join(", ")}` });
  }

  const newRecord = {
    id: uuidv4(),
    title,
    category,
    type,
    watched_status,
    recommendations: recommendations || "",
    release_year,
    length_or_episodes,
    synopsis,
    date_added: new Date().toISOString(),
  };

  if (image) {
    newRecord.image = image;
  }

  fs.readFile(dataPath, "utf8", (err, data) => {
    let records = [];
    if (!err) {
      try {
        records = JSON.parse(data);
      } catch (parseErr) {
        console.error("Error parsing JSON data:", parseErr);
      }
    }
    records.push(newRecord);
    fs.writeFile(dataPath, JSON.stringify(records, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing to data file:", writeErr);
        return res.status(500).json({ error: "Error writing to data file" });
      }
      res.status(201).json(newRecord);
    });
  });
});

// PUT /api/records/:id - Update a record
app.put("/api/records/:id", (req, res) => {
  const recordId = req.params.id;
  const updatedData = req.body;

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
    const recordIndex = records.findIndex((r) => r.id === recordId);
    if (recordIndex === -1) {
      return res.status(404).json({ error: "Record not found" });
    }
    const updatedRecord = { ...records[recordIndex], ...updatedData };
    records[recordIndex] = updatedRecord;
    fs.writeFile(dataPath, JSON.stringify(records, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing to data file:", writeErr);
        return res.status(500).json({ error: "Error writing to data file" });
      }
      res.json(updatedRecord);
    });
  });
});

// DELETE /api/records/:id - Delete a record
app.delete("/api/records/:id", (req, res) => {
  const recordId = req.params.id;
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
    const newRecords = records.filter((r) => r.id !== recordId);
    fs.writeFile(dataPath, JSON.stringify(newRecords, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error writing to data file:", writeErr);
        return res.status(500).json({ error: "Error writing to data file" });
      }
      res.json({ message: "Record deleted successfully" });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
