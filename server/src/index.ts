import express from "express";
import cors from "cors";
import http from "http";
import { getRandomPeople, getStats } from "./db.js";
import { attachMultiplayer } from "./multiplayer.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
