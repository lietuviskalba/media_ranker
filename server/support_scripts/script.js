const fs = require("fs");

// Load and parse the JSON file
fs.readFile("data.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  try {
    let jsonArray = JSON.parse(data);

    // Function to convert keys to snake_case
    const toSnakeCase = (str) => {
      return str.toLowerCase().replace(/\s+/g, "_"); // Convert spaces to underscores
    };

    // Process each record
    let updatedJson = jsonArray.map((record) => {
      let newRecord = {};

      Object.keys(record).forEach((key) => {
        let newKey = toSnakeCase(key); // Convert to snake_case

        // Special handling for "length/episodes" and "release year"
        if (newKey.includes("/")) {
          newKey = newKey.replace("/", "_or_");
        }

        // Modify specific fields
        if (newKey === "type" && record[key].toLowerCase() === "standard") {
          newRecord[newKey] = "Live action"; // Convert "standard" to "live_action"
        } else if (
          newKey === "recommendations" ||
          newKey === "watched_status"
        ) {
          newRecord[newKey] = "-"; // Set to dash "-"
        } else if (
          newKey === "length_or_episodes" ||
          newKey === "release_year"
        ) {
          newRecord[newKey] = String(record[key]).replace("/", "_or_");
        } else {
          newRecord[newKey] = record[key];
        }
      });

      return newRecord;
    });

    // Save the updated JSON file
    fs.writeFile(
      "data_cleaned.json",
      JSON.stringify(updatedJson, null, 2),
      "utf8",
      (err) => {
        if (err) {
          console.error("Error writing file:", err);
        } else {
          console.log(
            "JSON file successfully updated and saved as data_cleaned.json"
          );
        }
      }
    );
  } catch (parseErr) {
    console.error("Error parsing JSON:", parseErr);
  }
});
