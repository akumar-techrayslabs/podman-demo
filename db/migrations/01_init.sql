-- Run automatically via docker-entrypoint-initdb.d
CREATE TABLE IF NOT EXISTS notes (
    id          SERIAL PRIMARY KEY,
    title       TEXT        NOT NULL,
    body        TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed a couple of rows so new devs see data immediately
INSERT INTO notes (title, body) VALUES
  ('Welcome!',        'This project runs on Podman + GHCR.'),
  ('How to pull',     'Run: podman pull ghcr.io/<your-username>/podman-demo:latest');
