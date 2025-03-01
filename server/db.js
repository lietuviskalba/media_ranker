// db.js
require("dotenv").config();

const { Pool } = require("pg");

// Determine whether we're running locally or in production
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
