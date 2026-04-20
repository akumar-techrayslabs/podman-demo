# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ─── Stage 2: Final lean image ───────────────────────────────────────────────
FROM node:20-alpine AS runner
LABEL org.opencontainers.image.source="https://github.com/<your-username>/podman-demo"
LABEL org.opencontainers.image.description="Express + PostgreSQL demo for Podman & GHCR"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copy only prod dependencies + source
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

# Non-root user for security (Podman best-practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/app.js"]
