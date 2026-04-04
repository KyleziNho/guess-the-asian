import type { Person } from "./types";

export interface PlayerProfile {
  name: string;
  avatar: string;
  color: string;
}

export interface Player extends PlayerProfile {
  id: string;
  ready: boolean;
  connected: boolean;
  disconnectedAt: number | null;
  score: number;
  streak: number;
  bestStreak: number;
  hasPicked: boolean;
}

export interface RoomSettings {
  rounds: number;
}

export interface RoundRecord {
  person: Person;
  picks: Record<string, string>;
  correct: Record<string, boolean>;
}

export type RoomPhase = "lobby" | "playing" | "reveal" | "gameover";

export interface RoomState {
  code: string;
  phase: RoomPhase;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  person: Person | null;
  options: string[];
  picks: Record<string, string> | null;
  history: RoundRecord[];
  graceMs: number;
  serverTime: number;
  mode: "duel" | "solo";
}

export interface FloatingReaction {
  id: string;
  playerId: string;
  emoji: string;
  createdAt: number;
}

// Client ➝ Server
export type OutgoingMessage =
  | { type: "create_room"; profile: PlayerProfile }
  | {
      type: "join_room";
      code: string;
      profile: PlayerProfile;
      resumePlayerId?: string | null;
    }
  | { type: "leave_room" }
  | { type: "update_profile"; profile: PlayerProfile }
  | { type: "toggle_ready" }
  | { type: "update_settings"; settings: RoomSettings }
  | { type: "start_game" }
  | { type: "pick"; country: string }
  | { type: "next_round" }
  | { type: "reaction"; emoji: string }
  | { type: "rematch" }
  | { type: "forfeit_opponent" };

// Server ➝ Client
export type IncomingMessage =
  | { type: "joined"; playerId: string; roomCode: string }
  | { type: "left" }
  | { type: "room_state"; state: RoomState }
  | { type: "reaction"; playerId: string; emoji: string; id: string }
  | { type: "error"; message: string };

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "reconnecting"
  | "connected"
  | "disconnected";
