const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

/**
 * ─────────────────────────────────────────────────────────────
 * DATABASE CONFIG
 * ─────────────────────────────────────────────────────────────
 */
const pool = new Pool({
  host: process.env.DB_HOST || "db", // IMPORTANT for container
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "demodb",
  max: 10, // connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Test DB connection at startup
 */
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL connected");
    client.release();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1); // stop app if DB fails
  }
};

/**
 * ─────────────────────────────────────────────────────────────
 * HEALTH CHECK
 * ─────────────────────────────────────────────────────────────
 */
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({
      status: "OK",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date(),
    });
  } catch (err) {
    res.status(500).json({
      status: "ERROR",
      database: "disconnected",
      error: err.message,
    });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * NOTES APIs
 * ─────────────────────────────────────────────────────────────
 */

// GET all notes
app.get("/notes", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM notes ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// CREATE note
app.post("/notes", async (req, res, next) => {
  try {
    const { title, body } = req.body;

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const { rows } = await pool.query(
      "INSERT INTO notes (title, body) VALUES ($1, $2) RETURNING *",
      [title, body || ""]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE note
app.delete("/notes/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM notes WHERE id = $1",
      [req.params.id]
    );

    if (!rowCount) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * GLOBAL ERROR HANDLER (IMPORTANT)
 * ─────────────────────────────────────────────────────────────
 */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);

  res.status(500).json({
    status: "error",
    message: err.message || "Internal Server Error",
  });
});

/**
 * ─────────────────────────────────────────────────────────────
 * SERVER START
 * ─────────────────────────────────────────────────────────────
 */
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 API running on port ${PORT}`);
  });
};

startServer();

module.exports = app;