// migrate.js
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Create a new pool to connect to your PostgreSQL database.
// Adjust the connection parameters as needed.
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "db_my",
  password: "mypass",
  port: 5432,
});

// Path to your JSON file
const dataPath = path.join(__dirname, "data.json");

// Read and parse the JSON file data
const records = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const migrate = async () => {
  try {
    // Loop over each record in the JSON file
    const isValidUUID = (str) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str
      );

    for (const record of records) {
      // Use the record id if valid, otherwise generate a new one
      const id = isValidUUID(record.id) ? record.id : uuidv4();

      const query = `
          INSERT INTO media_records (
            id, title, category, type, watched_status,
            recommendations, release_year, length_or_episodes,
            synopsis, image, date_added
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING;
        `;
      const values = [
        id,
        record.title,
        record.category,
        record.type,
        record.watched_status,
        record.recommendations || "",
        record.release_year,
        record.length_or_episodes,
        record.synopsis,
        record.image || "",
        record.date_added,
      ];
      await pool.query(query, values);
    }
    console.log("Migration complete");
    await pool.end();
  } catch (err) {
    console.error("Migration error", err);
  }
};

migrate();
