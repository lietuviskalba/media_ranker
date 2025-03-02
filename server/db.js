// db.js
require("dotenv").config();

const { Pool } = require("pg");

// Determine whether we're running locally or in production
const isProduction = process.env.NODE_ENV === "production";

// Use a local connection string when not in production
const connectionString = isProduction
  ? process.env.DATABASE_URL
  : process.env.LOCAL_DATABASE_URL;

const pool = new Pool({
  connectionString,
  host: "127.0.0.1",
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));

module.exports = pool;
