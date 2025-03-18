// db.js
require("dotenv").config();
const { Pool } = require("pg");

// Read environment variables
const isProduction = process.env.NODE_ENV === "production";
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: isProduction ? false : false, // No need for SSL on the local server
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));

module.exports = pool;
