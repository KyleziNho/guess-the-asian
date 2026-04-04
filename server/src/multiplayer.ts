import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { randomUUID } from "crypto";
import { getRandomPeople, type Person } from "./db.js";

// ──────────────────────────────────────────────────────────────────────────────
// Types (kept in sync with client/src/lib/multiplayerTypes.ts)
// ──────────────────────────────────────────────────────────────────────────────

interface PlayerProfile {
  name: string;
  avatar: string;
  color: string;
}

interface Player extends PlayerProfile {
  id: string;
  ready: boolean;
  connected: boolean;
  disconnectedAt: number | null;
  score: number;
  streak: number;
  bestStreak: number;
  hasPicked: boolean;
}

interface RoomSettings {
  rounds: number;
}

interface RoundRecord {
  person: Person;
  picks: Record<string, string>; // playerId -> country
  correct: Record<string, boolean>;
}

type RoomPhase = "lobby" | "playing" | "reveal" | "gameover";

interface PublicRoomState {
  code: string;
  phase: RoomPhase;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  person: Person | null;
  options: string[];
  // Only populated during "reveal" & "gameover"
  picks: Record<string, string> | null;
  history: RoundRecord[];
  // Grace period for disconnected players (ms)
  graceMs: number;
  // Server's current time, for clock-skew adjustment on the client
  serverTime: number;
  // "solo" when a disconnected opponent was forfeited; otherwise "duel"
  mode: "duel" | "solo";
}

interface Room {
  code: string;
  phase: RoomPhase;
  hostId: string;
  settings: RoomSettings;
  players: Map<string, Player>;
  sockets: Map<string, WebSocket>;
  people: Person[];
  optionsPerRound: string[][];
  currentRound: number;
  picks: Map<string, string>; // round-local, cleared each round
  history: RoundRecord[];
  revealTimer: NodeJS.Timeout | null;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  mode: "duel" | "solo";
  // IDs marked as forfeited; excluded from active play but preserved for history
  forfeitedIds: Set<string>;
  lastActivityAt: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Indonesia",
  "Malaysia",
  "Thailand",
  "China",
  "Vietnam",
  "South Korea",
  "Japan",
];
const NUM_OPTIONS = 4;
const DEFAULT_ROUNDS = 10;
const MAX_PLAYERS = 2;
const REVEAL_AUTO_ADVANCE_MS = 3800;
const DISCONNECT_GRACE_MS = 120_000; // 2 minutes
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // unambiguous

// Rate limiting / abuse prevention
const MAX_MSG_BYTES = 4096;
const RATE_WINDOW_MS = 1000;
const RATE_MAX_MSGS = 30;
const REACTION_COOLDOWN_MS = 400;
const ROOM_IDLE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const ROOM_SWEEP_INTERVAL_MS = 5 * 60 * 1000; // every 5 min

// ──────────────────────────────────────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────────────────────────────────────

function randomId(): string {
  return randomUUID();
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(person: Person): string[] {
  const distractors = shuffle(COUNTRIES.filter((c) => c !== person.country)).slice(
    0,
    NUM_OPTIONS - 1
  );
  return shuffle([...distractors, person.country]);
}

function generateRoomCode(taken: Set<string>): string {
  for (let attempt = 0; attempt < 200; attempt++) {
    let code = "";
    for (let i = 0; i < 4; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!taken.has(code)) return code;
  }
  throw new Error("Room codes exhausted");
}

function sanitizeProfile(raw: unknown): PlayerProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const name =
    typeof r.name === "string" && r.name.trim().length > 0
      ? r.name.trim().slice(0, 16)
      : "Player";
  const avatar =
    typeof r.avatar === "string" && r.avatar.length <= 8 ? r.avatar : "🦊";
  const color = typeof r.color === "string" ? r.color.slice(0, 24) : "gold";
  return { name, avatar, color };
}

// ──────────────────────────────────────────────────────────────────────────────
// Room Manager
// ──────────────────────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();
const playerRoom = new Map<string, string>(); // playerId -> roomCode

interface SocketMeta {
  playerId?: string;
  roomCode?: string;
  msgTimestamps: number[];
  lastReactionAt: number;
}

const socketMeta = new WeakMap<WebSocket, SocketMeta>();

function freshMeta(): SocketMeta {
  return { msgTimestamps: [], lastReactionAt: 0 };
}

function checkRate(meta: SocketMeta): boolean {
  const now = Date.now();
  // Drop timestamps outside window
  let i = 0;
  while (i < meta.msgTimestamps.length && now - meta.msgTimestamps[i] >= RATE_WINDOW_MS) {
    i++;
  }
  if (i > 0) meta.msgTimestamps.splice(0, i);
  if (meta.msgTimestamps.length >= RATE_MAX_MSGS) return false;
  meta.msgTimestamps.push(now);
  return true;
}

function send(ws: WebSocket, msg: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function sendError(ws: WebSocket, message: string) {
  send(ws, { type: "error", message });
}

function publicState(room: Room): PublicRoomState {
  const person =
    room.phase === "playing" || room.phase === "reveal"
      ? room.people[room.currentRound] ?? null
      : null;
  const options =
    room.phase === "playing" || room.phase === "reveal"
      ? room.optionsPerRound[room.currentRound] ?? []
      : [];
  const includePicks = room.phase === "reveal" || room.phase === "gameover";
  return {
    code: room.code,
    phase: room.phase,
    hostId: room.hostId,
    settings: room.settings,
    players: Array.from(room.players.values()),
    currentRound: room.currentRound,
    totalRounds: room.settings.rounds,
    person,
    options,
    picks: includePicks ? Object.fromEntries(room.picks) : null,
    history: room.history,
    graceMs: DISCONNECT_GRACE_MS,
    serverTime: Date.now(),
    mode: room.mode,
  };
}

function touchRoom(room: Room) {
  room.lastActivityAt = Date.now();
}

function broadcastState(room: Room) {
  const state = publicState(room);
  for (const [, ws] of room.sockets) {
    send(ws, { type: "room_state", state });
  }
}

function broadcastReaction(
  room: Room,
  playerId: string,
  emoji: string,
  reactionId: string
) {
  for (const [, ws] of room.sockets) {
    send(ws, { type: "reaction", playerId, emoji, id: reactionId });
  }
}

function createRoom(
  profile: PlayerProfile,
  ws: WebSocket
): { room: Room; player: Player } {
  const taken = new Set(rooms.keys());
  const code = generateRoomCode(taken);
  const playerId = randomId();
  const player: Player = {
    id: playerId,
    ...profile,
    ready: false,
    connected: true,
    disconnectedAt: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    hasPicked: false,
  };
  const room: Room = {
    code,
    phase: "lobby",
    hostId: playerId,
    settings: { rounds: DEFAULT_ROUNDS },
    players: new Map([[playerId, player]]),
    sockets: new Map([[playerId, ws]]),
    people: [],
    optionsPerRound: [],
    currentRound: 0,
    picks: new Map(),
    history: [],
    revealTimer: null,
    disconnectTimers: new Map(),
    mode: "duel",
    forfeitedIds: new Set(),
    lastActivityAt: Date.now(),
  };
  rooms.set(code, room);
  playerRoom.set(playerId, code);
  const meta = socketMeta.get(ws) ?? freshMeta();
  meta.playerId = playerId;
  meta.roomCode = code;
  socketMeta.set(ws, meta);
  return { room, player };
}

function joinRoom(
  code: string,
  profile: PlayerProfile,
  ws: WebSocket,
  resumePlayerId: string | null
): { room: Room; player: Player } | { error: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { error: "Room not found" };

  // Try to resume a disconnected player
  if (resumePlayerId) {
    const existing = room.players.get(resumePlayerId);
    if (existing && !existing.connected && !room.forfeitedIds.has(resumePlayerId)) {
      existing.connected = true;
      existing.disconnectedAt = null;
      // Keep prior score; only accept profile fields if in lobby to prevent
      // identity-spoofing mid-match
      if (room.phase === "lobby") {
        existing.name = profile.name;
        existing.avatar = profile.avatar;
        existing.color = profile.color;
      }
      room.sockets.set(resumePlayerId, ws);
      const dc = room.disconnectTimers.get(resumePlayerId);
      if (dc) {
        clearTimeout(dc);
        room.disconnectTimers.delete(resumePlayerId);
      }
      playerRoom.set(resumePlayerId, room.code);
      const meta = socketMeta.get(ws) ?? freshMeta();
      meta.playerId = resumePlayerId;
      meta.roomCode = room.code;
      socketMeta.set(ws, meta);
      touchRoom(room);
      return { room, player: existing };
    }
  }

  // Fresh join — need open slot
  if (room.players.size >= MAX_PLAYERS) {
    // Allow join only if someone is disconnected AND grace expired is moot:
    // Check if any slot is effectively free (disconnected).
    const freeSlot = Array.from(room.players.values()).find(
      (p) => !p.connected
    );
    if (!freeSlot) return { error: "Room is full" };
    // Take over the disconnected slot
    room.players.delete(freeSlot.id);
    const dc = room.disconnectTimers.get(freeSlot.id);
    if (dc) clearTimeout(dc);
    room.disconnectTimers.delete(freeSlot.id);
    if (room.hostId === freeSlot.id) {
      // promote remaining player temporarily — will be reassigned below
    }
  }

  if (room.phase !== "lobby") {
    return { error: "Game already in progress" };
  }

  const playerId = randomId();
  const player: Player = {
    id: playerId,
    ...profile,
    ready: false,
    connected: true,
    disconnectedAt: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    hasPicked: false,
  };
  room.players.set(playerId, player);
  room.sockets.set(playerId, ws);
  if (!room.players.has(room.hostId)) {
    room.hostId = playerId;
  }
  playerRoom.set(playerId, room.code);
  const meta = socketMeta.get(ws) ?? freshMeta();
  meta.playerId = playerId;
  meta.roomCode = room.code;
  socketMeta.set(ws, meta);
  touchRoom(room);
  return { room, player };
}

function leaveRoom(playerId: string, reason: "leave" | "disconnect") {
  const code = playerRoom.get(playerId);
  if (!code) return;
  const room = rooms.get(code);
  if (!room) {
    playerRoom.delete(playerId);
    return;
  }
  const player = room.players.get(playerId);
  const socket = room.sockets.get(playerId);

  if (reason === "leave") {
    // Detach socket binding from this player
    room.sockets.delete(playerId);
    room.players.delete(playerId);
    room.forfeitedIds.delete(playerId);
    playerRoom.delete(playerId);
    const dc = room.disconnectTimers.get(playerId);
    if (dc) {
      clearTimeout(dc);
      room.disconnectTimers.delete(playerId);
    }
    // Reassign host if needed
    if (room.hostId === playerId && room.players.size > 0) {
      // Prefer a connected player
      const connected = Array.from(room.players.values()).find((p) => p.connected);
      room.hostId = (connected ?? room.players.values().next().value as Player).id;
    }
    // Mid-game with fewer than 2 active players → drop back to lobby
    const active = Array.from(room.players.values()).filter(
      (p) => !room.forfeitedIds.has(p.id)
    );
    if (
      (room.phase === "playing" || room.phase === "reveal") &&
      active.length < 2
    ) {
      if (room.revealTimer) {
        clearTimeout(room.revealTimer);
        room.revealTimer = null;
      }
      room.phase = "lobby";
      room.mode = "duel";
      resetGameState(room);
    }
    if (room.players.size === 0) {
      destroyRoom(room);
      if (socket) {
        const meta = socketMeta.get(socket);
        if (meta) {
          meta.playerId = undefined;
          meta.roomCode = undefined;
        }
      }
      return;
    }
    touchRoom(room);
    broadcastState(room);
    if (socket) {
      const meta = socketMeta.get(socket);
      if (meta) {
        meta.playerId = undefined;
        meta.roomCode = undefined;
      }
    }
  } else {
    // disconnect — keep player in room, mark disconnected, start grace timer
    room.sockets.delete(playerId);
    if (player) {
      player.connected = false;
      player.disconnectedAt = Date.now();
    }
    const existing = room.disconnectTimers.get(playerId);
    if (existing) clearTimeout(existing);
    room.disconnectTimers.set(
      playerId,
      setTimeout(() => {
        leaveRoom(playerId, "leave");
      }, DISCONNECT_GRACE_MS)
    );
    touchRoom(room);
    // If the survivor has already picked, don't make them wait
    if (!maybeReveal(room)) {
      broadcastState(room);
    }
  }
}

function destroyRoom(room: Room) {
  if (room.revealTimer) clearTimeout(room.revealTimer);
  for (const t of room.disconnectTimers.values()) clearTimeout(t);
  rooms.delete(room.code);
}

function resetGameState(room: Room) {
  room.people = [];
  room.optionsPerRound = [];
  room.currentRound = 0;
  room.picks.clear();
  room.history = [];
  room.mode = "duel";
  room.forfeitedIds.clear();
  for (const p of room.players.values()) {
    p.score = 0;
    p.streak = 0;
    p.bestStreak = 0;
    p.hasPicked = false;
    p.ready = false;
  }
}

function startGame(room: Room) {
  const people = getRandomPeople(room.settings.rounds);
  room.people = people;
  room.optionsPerRound = people.map(generateOptions);
  room.currentRound = 0;
  room.picks.clear();
  room.history = [];
  room.mode = "duel";
  room.forfeitedIds.clear();
  for (const p of room.players.values()) {
    p.score = 0;
    p.streak = 0;
    p.bestStreak = 0;
    p.hasPicked = false;
  }
  room.phase = "playing";
  touchRoom(room);
  broadcastState(room);
}

// Re-evaluate reveal conditions (call after connection changes)
function maybeReveal(room: Room) {
  if (room.phase !== "playing") return false;
  const active = Array.from(room.players.values()).filter(
    (p) => p.connected && !room.forfeitedIds.has(p.id)
  );
  if (active.length === 0) return false;
  const allPicked = active.every((p) => room.picks.has(p.id));
  if (allPicked) {
    revealRound(room);
    return true;
  }
  return false;
}

function handlePick(room: Room, playerId: string, country: string) {
  if (room.phase !== "playing") return;
  if (room.forfeitedIds.has(playerId)) return;
  const options = room.optionsPerRound[room.currentRound];
  if (!options.includes(country)) return;
  if (room.picks.has(playerId)) return; // locked
  const player = room.players.get(playerId);
  if (!player) return;
  room.picks.set(playerId, country);
  player.hasPicked = true;
  touchRoom(room);

  if (!maybeReveal(room)) {
    broadcastState(room);
  }
}

function revealRound(room: Room) {
  room.phase = "reveal";
  const person = room.people[room.currentRound];
  const pickMap: Record<string, string> = {};
  const correctMap: Record<string, boolean> = {};
  for (const player of room.players.values()) {
    const pick = room.picks.get(player.id);
    if (pick) {
      pickMap[player.id] = pick;
      const wasCorrect = pick === person.country;
      correctMap[player.id] = wasCorrect;
      if (wasCorrect) {
        player.score += 1;
        player.streak += 1;
        player.bestStreak = Math.max(player.bestStreak, player.streak);
      } else {
        player.streak = 0;
      }
    } else {
      correctMap[player.id] = false;
      player.streak = 0;
    }
  }
  room.history.push({ person, picks: pickMap, correct: correctMap });

  if (room.revealTimer) clearTimeout(room.revealTimer);
  room.revealTimer = setTimeout(() => {
    advanceRound(room);
  }, REVEAL_AUTO_ADVANCE_MS);

  broadcastState(room);
}

function advanceRound(room: Room) {
  if (room.revealTimer) {
    clearTimeout(room.revealTimer);
    room.revealTimer = null;
  }
  room.currentRound += 1;
  room.picks.clear();
  for (const p of room.players.values()) p.hasPicked = false;
  if (room.currentRound >= room.settings.rounds) {
    room.phase = "gameover";
  } else {
    room.phase = "playing";
  }
  broadcastState(room);
}

function handleRematch(room: Room) {
  if (room.phase !== "gameover") return;
  room.phase = "lobby";
  resetGameState(room);
  touchRoom(room);
  broadcastState(room);
}

function handleForfeitOpponent(room: Room, requesterId: string) {
  if (room.phase !== "playing" && room.phase !== "reveal") return;
  const requester = room.players.get(requesterId);
  if (!requester || !requester.connected) return;
  // Find a disconnected opponent to forfeit
  const target = Array.from(room.players.values()).find(
    (p) => p.id !== requesterId && !p.connected && !room.forfeitedIds.has(p.id)
  );
  if (!target) return;

  // Clear their grace timer, mark forfeited, enter solo mode
  const dc = room.disconnectTimers.get(target.id);
  if (dc) {
    clearTimeout(dc);
    room.disconnectTimers.delete(target.id);
  }
  room.forfeitedIds.add(target.id);
  room.mode = "solo";
  touchRoom(room);
  // If survivor already locked their pick, reveal immediately
  if (!maybeReveal(room)) {
    broadcastState(room);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Message handler
// ──────────────────────────────────────────────────────────────────────────────

function handleMessage(ws: WebSocket, data: Record<string, unknown>) {
  const type = data.type;
  const meta = socketMeta.get(ws);
  if (!meta) return;

  switch (type) {
    case "create_room": {
      if (meta.playerId) {
        sendError(ws, "Already in a room");
        return;
      }
      const profile = sanitizeProfile(data.profile);
      if (!profile) {
        sendError(ws, "Invalid profile");
        return;
      }
      const { room, player } = createRoom(profile, ws);
      send(ws, { type: "joined", playerId: player.id, roomCode: room.code });
      broadcastState(room);
      return;
    }
    case "join_room": {
      if (meta.playerId) {
        sendError(ws, "Already in a room");
        return;
      }
      const code = typeof data.code === "string" ? data.code.toUpperCase() : "";
      const profile = sanitizeProfile(data.profile);
      if (!profile || !code) {
        sendError(ws, "Invalid join payload");
        return;
      }
      const resumeId =
        typeof data.resumePlayerId === "string" ? data.resumePlayerId : null;
      const result = joinRoom(code, profile, ws, resumeId);
      if ("error" in result) {
        sendError(ws, result.error);
        return;
      }
      send(ws, {
        type: "joined",
        playerId: result.player.id,
        roomCode: result.room.code,
      });
      broadcastState(result.room);
      return;
    }
    case "leave_room": {
      if (!meta.playerId) return;
      leaveRoom(meta.playerId, "leave");
      // Keep the rate-limit context; only clear room bindings
      meta.playerId = undefined;
      meta.roomCode = undefined;
      send(ws, { type: "left" });
      return;
    }
    case "update_profile": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room) return;
      // Freeze identity once the match starts — prevents in-game spoofing
      if (room.phase !== "lobby") return;
      const profile = sanitizeProfile(data.profile);
      if (!profile) return;
      const player = room.players.get(meta.playerId);
      if (!player) return;
      player.name = profile.name;
      player.avatar = profile.avatar;
      player.color = profile.color;
      touchRoom(room);
      broadcastState(room);
      return;
    }
    case "toggle_ready": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room || room.phase !== "lobby") return;
      const player = room.players.get(meta.playerId);
      if (!player) return;
      player.ready = !player.ready;
      broadcastState(room);
      return;
    }
    case "update_settings": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room || room.phase !== "lobby") return;
      if (room.hostId !== meta.playerId) return;
      const rounds = Number((data.settings as Record<string, unknown>)?.rounds);
      if (Number.isFinite(rounds) && rounds >= 5 && rounds <= 20) {
        room.settings.rounds = Math.floor(rounds);
        broadcastState(room);
      }
      return;
    }
    case "start_game": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room || room.phase !== "lobby") return;
      if (room.hostId !== meta.playerId) {
        sendError(ws, "Only the host can start the game");
        return;
      }
      if (room.players.size < 2) {
        sendError(ws, "Need 2 players to start");
        return;
      }
      const allReady = Array.from(room.players.values()).every((p) => p.ready);
      if (!allReady) {
        sendError(ws, "Both players must be ready");
        return;
      }
      startGame(room);
      return;
    }
    case "pick": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room) return;
      const country = typeof data.country === "string" ? data.country : "";
      if (!country) return;
      handlePick(room, meta.playerId, country);
      return;
    }
    case "next_round": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room || room.phase !== "reveal") return;
      advanceRound(room);
      return;
    }
    case "reaction": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room) return;
      const now = Date.now();
      if (now - meta.lastReactionAt < REACTION_COOLDOWN_MS) return;
      meta.lastReactionAt = now;
      const emoji = typeof data.emoji === "string" ? data.emoji.slice(0, 8) : "";
      if (!emoji) return;
      broadcastReaction(room, meta.playerId, emoji, randomId());
      return;
    }
    case "rematch": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room) return;
      if (room.hostId !== meta.playerId) {
        sendError(ws, "Only the host can start a rematch");
        return;
      }
      handleRematch(room);
      return;
    }
    case "forfeit_opponent": {
      if (!meta.playerId || !meta.roomCode) return;
      const room = rooms.get(meta.roomCode);
      if (!room) return;
      handleForfeitOpponent(room, meta.playerId);
      return;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Entry point
// ──────────────────────────────────────────────────────────────────────────────

export function attachMultiplayer(server: import("http").Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    socketMeta.set(ws, freshMeta());

    ws.on("message", (raw) => {
      const meta = socketMeta.get(ws);
      if (!meta) return;
      // Size cap
      const text = raw.toString();
      if (text.length > MAX_MSG_BYTES) {
        sendError(ws, "Message too large");
        return;
      }
      // Rate limit
      if (!checkRate(meta)) {
        sendError(ws, "Too many messages — slow down");
        return;
      }
      try {
        const data = JSON.parse(text);
        if (data && typeof data === "object") {
          handleMessage(ws, data as Record<string, unknown>);
        }
      } catch {
        sendError(ws, "Malformed message");
      }
    });

    ws.on("close", () => {
      const meta = socketMeta.get(ws);
      if (meta?.playerId) {
        leaveRoom(meta.playerId, "disconnect");
      }
      socketMeta.delete(ws);
    });

    // Heartbeat
    ws.on("pong", () => {
      /* noop */
    });
  });

  // Periodic ping to keep connections alive behind proxies
  setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch {
          /* ignore */
        }
      }
    }
  }, 30_000);

  // Sweep idle rooms with no activity
  setInterval(() => {
    const now = Date.now();
    for (const room of Array.from(rooms.values())) {
      if (now - room.lastActivityAt > ROOM_IDLE_TTL_MS) {
        // Kick any players still mapped
        for (const pid of Array.from(room.players.keys())) {
          playerRoom.delete(pid);
        }
        destroyRoom(room);
      }
    }
  }, ROOM_SWEEP_INTERVAL_MS);

  return wss;
}
