// server/db.js
require("dotenv").config(); // Load env variables

const { Pool } = require("pg");

// Always use DATABASE_URL (set in Railway)
const connectionString = process.env.DATABASE_URL;

console.log("Using connectionString:", connectionString);

if (!connectionString) {
  console.error("DATABASE_URL is not set!");
}

const pool = new Pool({
  connectionString,
  // Always require SSL in production:
  ssl: { rejectUnauthorized: false },
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));

module.exports = pool;
