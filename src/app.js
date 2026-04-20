const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// PostgreSQL connection pool — reads env vars set in container
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "demodb",
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: err.message });
  }
});

// ─── GET all notes ─────────────────────────────────────────────────────────
app.get("/notes", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM notes ORDER BY created_at DESC"
  );
  res.json(rows);
});

// ─── POST a new note ────────────────────────────────────────────────────────
app.post("/notes", async (req, res) => {
  const { title, body } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const { rows } = await pool.query(
    "INSERT INTO notes (title, body) VALUES ($1, $2) RETURNING *",
    [title, body || ""]
  );
  res.status(201).json(rows[0]);
});

// ─── DELETE a note ──────────────────────────────────────────────────────────
app.delete("/notes/:id", async (req, res) => {
  const { rowCount } = await pool.query("DELETE FROM notes WHERE id = $1", [
    req.params.id,
  ]);
  if (!rowCount) return res.status(404).json({ error: "not found" });
  res.json({ deleted: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀  API listening on port ${PORT}`));

module.exports = app;
