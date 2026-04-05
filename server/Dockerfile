# syntax=docker/dockerfile:1
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies (including dev) for the TS build
COPY package.json package-lock.json ./
RUN npm ci

# Copy source + SQLite database + config
COPY tsconfig.json ./
COPY src ./src
COPY data ./data

RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
# Railway injects PORT; we honour it in src/index.ts
ENV PORT=3001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Compiled JS + read-only game database
COPY --from=build /app/dist ./dist
COPY --from=build /app/data ./data

EXPOSE 3001

CMD ["node", "dist/index.js"]
