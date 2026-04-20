# 🐳 Podman Demo — Express.js + PostgreSQL

A complete reference project to learn **Podman** and **GitHub Container Registry (GHCR)**.
Clone it, run it, push it, and share it with your team.

---

## 📁 Project Structure

```
podman-demo/
├── src/
│   └── app.js                    # Express API (notes CRUD)
├── db/
│   └── migrations/
│       └── 01_init.sql           # Auto-runs on first DB start
├── .github/
│   └── workflows/
│       └── publish.yml           # CI: build + push to GHCR
├── Containerfile                 # Podman image definition (= Dockerfile)
├── compose.yaml                  # podman-compose / docker-compose
└── README.md
```

---

## 🚀 Quick Start (for co-workers)

### Option A — Pull from GHCR (no code needed)

```bash
# 1. Log in to GHCR with your GitHub token
podman login ghcr.io -u <your-github-username> --password-stdin <<< "<YOUR_PAT>"

# 2. Pull the image
podman pull ghcr.io/<your-username>/podman-demo:latest

# 3. Start a PostgreSQL container first
podman network create demo-net

podman run -d \
  --name demo_db \
  --network demo-net \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=demodb \
  -v pg_data:/var/lib/postgresql/data \
  postgres:16-alpine

# 4. Run the API container
podman run -d \
  --name demo_api \
  --network demo-net \
  -e DB_HOST=demo_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_NAME=demodb \
  -p 3000:3000 \
  ghcr.io/<your-username>/podman-demo:latest
```

### Option B — Build locally from source

```bash
git clone https://github.com/<your-username>/podman-demo.git
cd podman-demo

# Build the image (Podman reads Containerfile automatically)
podman build -t podman-demo:local .

# Run everything with podman-compose
podman-compose up -d
```

> **Install podman-compose:** `pip install podman-compose`

---

## 🔌 API Endpoints

| Method | URL           | Description         |
|--------|---------------|---------------------|
| GET    | `/health`     | DB connectivity check |
| GET    | `/notes`      | List all notes      |
| POST   | `/notes`      | Create a note       |
| DELETE | `/notes/:id`  | Delete a note       |

### Example calls (curl)

```bash
# Health check
curl http://localhost:3000/health

# Create a note
curl -X POST http://localhost:3000/notes \
  -H "Content-Type: application/json" \
  -d '{"title": "My first note", "body": "Hello from Podman!"}'

# List notes
curl http://localhost:3000/notes

# Delete note with id=1
curl -X DELETE http://localhost:3000/notes/1
```

---

## 🔑 Generating a GitHub PAT (Personal Access Token)

Co-workers need a PAT to pull from GHCR:

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Set scope: **read:packages**
3. Copy the token and use it to log in:
   ```bash
   podman login ghcr.io -u <github-username> --password-stdin <<< "<TOKEN>"
   ```

---

## 🏗️ How the CI/CD Pipeline Works

```
git push origin main
       │
       ▼
GitHub Actions (publish.yml)
       │
       ├─ Checks out code
       ├─ Logs in to ghcr.io using GITHUB_TOKEN (automatic, no setup!)
       ├─ Builds the image from Containerfile
       └─ Pushes tags:
            ghcr.io/<you>/podman-demo:latest
            ghcr.io/<you>/podman-demo:main
            ghcr.io/<you>/podman-demo:sha-<commit>
```

No secrets to configure — `GITHUB_TOKEN` is provided automatically by GitHub Actions.

---

## 🐟 Podman Cheat Sheet

```bash
# Build
podman build -t myapp:v1 .

# Run
podman run -d -p 3000:3000 --name myapp myapp:v1

# List running containers
podman ps

# View logs
podman logs -f myapp

# Stop & remove
podman stop myapp && podman rm myapp

# List local images
podman images

# Remove an image
podman rmi myapp:v1

# Inspect a container
podman inspect myapp

# Execute a shell inside a running container
podman exec -it myapp sh

# Tag for GHCR
podman tag myapp:v1 ghcr.io/<username>/myapp:v1

# Push to GHCR
podman push ghcr.io/<username>/myapp:v1

# Pull from GHCR
podman pull ghcr.io/<username>/myapp:latest
```

---

## 🔍 Key Concepts Explained

| Concept | Explanation |
|---|---|
| **Containerfile** | Same as Dockerfile — Podman supports both names |
| **GHCR** | GitHub's own container registry at `ghcr.io` — free for public repos |
| **Multi-stage build** | The `Containerfile` uses 2 stages to keep the final image small |
| **HEALTHCHECK** | Podman restarts unhealthy containers automatically |
| **Non-root user** | The app runs as `appuser`, not root — a security best practice |
| **Named volume** | `pg_data` persists PostgreSQL data across container restarts |
| **Network** | Containers on the same network find each other by service name (e.g., `db`) |

---

## 🛠️ Making the Package Public (so co-workers can pull without login)

1. Go to `https://github.com/<username>?tab=packages`
2. Click on **podman-demo**
3. **Package settings** → Change visibility to **Public**

After that, anyone can pull without authentication:
```bash
podman pull ghcr.io/<your-username>/podman-demo:latest
```

---

## 📦 Environment Variables Reference

| Variable      | Default     | Description          |
|---------------|-------------|----------------------|
| `DB_HOST`     | `localhost` | PostgreSQL hostname  |
| `DB_PORT`     | `5432`      | PostgreSQL port      |
| `DB_USER`     | `postgres`  | DB username          |
| `DB_PASSWORD` | `postgres`  | DB password          |
| `DB_NAME`     | `demodb`    | Database name        |
| `PORT`        | `3000`      | API server port      |
# podman-demo
