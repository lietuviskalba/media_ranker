// extractColumns.js
const fs = require("fs");

// Ensure at least a file and one key are provided
if (process.argv.length < 4) {
  console.error("Usage: node extractColumns.js <jsonFile> <key1> [<key2> ...]");
  process.exit(1);
}

const filePath = process.argv[2];
// Use the remaining arguments as keys (strings)
const keys = process.argv.slice(3);

fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    process.exit(1);
  }
  let records;
  try {
    records = JSON.parse(data);
  } catch (e) {
    console.error("Error parsing JSON:", e);
    process.exit(1);
  }
  if (!Array.isArray(records)) {
    console.error(
      "Error: Expected the JSON file to contain an array of objects."
    );
    process.exit(1);
  }

  // For each key, extract an array of text values from the records
  const columnsData = keys.map((key) =>
    records.map((record) =>
      record[key] !== undefined ? String(record[key]) : ""
    )
  );

  // Determine the maximum width for each column (using the key as header)
  const columnWidths = keys.map((key, i) =>
    Math.max(...columnsData[i].map((text) => text.length), key.length)
  );

  // Print header row
  const header = keys.map((key, i) => key.padEnd(columnWidths[i])).join(" | ");
  console.log(header);
  console.log(header.replace(/./g, "-"));

  // Print each row of data
  records.forEach((record) => {
    const row = keys
      .map((key, i) => {
        const text = record[key] !== undefined ? String(record[key]) : "";
        return text.padEnd(columnWidths[i]);
      })
      .join(" , ");
    console.log(row);
  });
});
