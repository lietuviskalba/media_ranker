const fs = require("fs");

fs.readFile("data2.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
    return;
  }

  try {
    const jsonData = JSON.parse(data);

    // Extract titles
    const titles = jsonData
      .map((record) => record.title)
      .filter((title) => title)
      .join("\n");

    // Write titles to a file
    fs.writeFileSync("titles.txt", titles, "utf8");
    console.log("Titles have been extracted and saved to titles.txt");
  } catch (parseError) {
    console.error("Error parsing JSON:", parseError);
  }
});
