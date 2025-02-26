const fs = require("fs");

// Load JSON data
const jsonFilePath = "data2.json";
const correctionsFilePath = "corrections.txt";

let jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
let corrections = fs.readFileSync(correctionsFilePath, "utf8").split("\n");

// Create a map for quick lookup of corrected values
let correctionsMap = {};
corrections.forEach((line) => {
  let parts = line.split(",");
  if (parts.length >= 3) {
    let title = parts[0].trim();
    let correctedLength = parts[2].trim();
    correctionsMap[title] = correctedLength;
  }
});

// Update JSON data
jsonData = jsonData.map((entry) => {
  if (correctionsMap[entry.title]) {
    entry.length_or_episodes = correctionsMap[entry.title];
  }
  return entry;
});

// Save updated JSON file
fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), "utf8");

console.log("JSON file updated successfully.");
