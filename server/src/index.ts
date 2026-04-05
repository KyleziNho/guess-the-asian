import express from "express";
import cors from "cors";
import http from "http";
import { getRandomPeople, getStats } from "./db.js";
import { attachMultiplayer } from "./multiplayer.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Comma-separated allowlist, e.g. ALLOWED_ORIGINS="https://foo.vercel.app,https://guess-the-asian.vercel.app"
// Falls back to permissive CORS when unset (dev / single-host deploys).
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

// Simple health probe for Railway
app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/api/random", (req, res) => {
  const count = Math.min(Math.max(parseInt(req.query.count as string) || 10, 1), 50);
  const people = getRandomPeople(count);
  res.json(people);
});

app.get("/api/stats", (_req, res) => {
  const stats = getStats();
  res.json(stats);
});

const server = http.createServer(app);
attachMultiplayer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket listening on ws://localhost:${PORT}/ws`);
});
