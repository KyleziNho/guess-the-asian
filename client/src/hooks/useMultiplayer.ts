import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConnectionStatus,
  FloatingReaction,
  IncomingMessage,
  OutgoingMessage,
  PlayerProfile,
  RoomSettings,
  RoomState,
} from "../lib/multiplayerTypes";
import { queueImages } from "../lib/imageCache";

const WS_URL = (() => {
  if (typeof window === "undefined") return "";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
})();

const REACTION_LIFETIME_MS = 2200;

export interface MultiplayerAPI {
  status: ConnectionStatus;
  room: RoomState | null;
  playerId: string | null;
  error: string | null;
  reactions: FloatingReaction[];
  createRoom: (profile: PlayerProfile) => void;
  joinRoom: (code: string, profile: PlayerProfile) => void;
  leaveRoom: () => void;
  updateProfile: (profile: PlayerProfile) => void;
  toggleReady: () => void;
  updateSettings: (settings: RoomSettings) => void;
  startGame: () => void;
  pick: (country: string) => void;
  nextRound: () => void;
  sendReaction: (emoji: string) => void;
  rematch: () => void;
  forfeitOpponent: () => void;
  clearError: () => void;
  reset: () => void;
}

interface ResumeInfo {
  playerId: string;
  roomCode: string;
}

function loadResume(): ResumeInfo | null {
  try {
    const raw = localStorage.getItem("gta-mp-resume");
    if (!raw) return null;
    return JSON.parse(raw) as ResumeInfo;
  } catch {
    return null;
  }
}

function saveResume(info: ResumeInfo | null) {
  try {
    if (info) {
      localStorage.setItem("gta-mp-resume", JSON.stringify(info));
    } else {
      localStorage.removeItem("gta-mp-resume");
    }
  } catch {
    /* ignore */
  }
}

const DEFAULT_AUTO_PROFILE: PlayerProfile = {
  name: "Player",
  avatar: "🦊",
  color: "gold",
};

function loadStoredProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem("gta-mp-profile");
    if (!raw) return DEFAULT_AUTO_PROFILE;
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    return {
      name: parsed.name?.trim() || "Player",
      avatar: parsed.avatar || "🦊",
      color: parsed.color || "gold",
    };
  } catch {
    return DEFAULT_AUTO_PROFILE;
  }
}

export function useMultiplayer(): MultiplayerAPI {
  const wsRef = useRef<WebSocket | null>(null);
  const outboxRef = useRef<OutgoingMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const prefetchedRef = useRef<Set<number>>(new Set());
  // Tracks whether we were in a room before the most recent disconnect.
  // If so, we attempt to silently resume on the next open.
  const wasInRoomRef = useRef(false);
  // True when the next "joined" ack belongs to an automatic resume attempt.
  const pendingResumeRef = useRef(false);
  // Retry backoff for reconnection attempts.
  const reconnectAttemptsRef = useRef(0);

  const send = useCallback((msg: OutgoingMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    } else {
      outboxRef.current.push(msg);
    }
  }, []);

  const flushOutbox = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const queue = outboxRef.current;
    outboxRef.current = [];
    for (const msg of queue) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    // If we were in a room already, this is a reconnect, not a fresh connect.
    setStatus(wasInRoomRef.current ? "reconnecting" : "connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setStatus("connected");

      // Auto-resume: if we had an active room, transparently rejoin.
      const resume = loadResume();
      if (wasInRoomRef.current && resume) {
        pendingResumeRef.current = true;
        const profile = loadStoredProfile();
        ws.send(
          JSON.stringify({
            type: "join_room",
            code: resume.roomCode,
            profile,
            resumePlayerId: resume.playerId,
          })
        );
      }
      flushOutbox();
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
    };

    ws.onerror = () => {
      setStatus("disconnected");
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as IncomingMessage;
        handleIncoming(data);
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flushOutbox]);

  const handleIncoming = useCallback((data: IncomingMessage) => {
    switch (data.type) {
      case "joined":
        pendingResumeRef.current = false;
        wasInRoomRef.current = true;
        setPlayerId(data.playerId);
        saveResume({ playerId: data.playerId, roomCode: data.roomCode });
        setError(null);
        break;
      case "left":
        wasInRoomRef.current = false;
        setRoom(null);
        setPlayerId(null);
        saveResume(null);
        prefetchedRef.current.clear();
        break;
      case "room_state":
        setRoom(data.state);
        if (
          data.state.person &&
          !prefetchedRef.current.has(data.state.currentRound)
        ) {
          prefetchedRef.current.add(data.state.currentRound);
          queueImages([data.state.person.image_url]);
        }
        break;
      case "reaction": {
        const reaction: FloatingReaction = {
          id: data.id,
          playerId: data.playerId,
          emoji: data.emoji,
          createdAt: Date.now(),
        };
        setReactions((prev) => [...prev, reaction]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== data.id));
        }, REACTION_LIFETIME_MS);
        break;
      }
      case "error":
        // If the server rejected our silent resume attempt, drop the stale
        // resume info quietly — don't spook the user with "Room not found".
        if (pendingResumeRef.current) {
          pendingResumeRef.current = false;
          wasInRoomRef.current = false;
          saveResume(null);
          setRoom(null);
          setPlayerId(null);
          prefetchedRef.current.clear();
        } else {
          setError(data.message);
        }
        break;
    }
  }, []);

  // Connect on mount. If localStorage already holds a resume token from a
  // previous session, flag us for auto-resume so the first open rejoins.
  useEffect(() => {
    if (loadResume()) {
      wasInRoomRef.current = true;
    }
    connect();
    return () => {
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-reconnect when disconnected, with exponential backoff
  useEffect(() => {
    if (status !== "disconnected") return;
    const attempt = reconnectAttemptsRef.current;
    const delay = Math.min(500 * 2 ** attempt, 8000);
    reconnectAttemptsRef.current = attempt + 1;
    const timer = setTimeout(() => connect(), delay);
    return () => clearTimeout(timer);
  }, [status, connect]);

  // Actions
  const createRoom = useCallback(
    (profile: PlayerProfile) => send({ type: "create_room", profile }),
    [send]
  );

  const joinRoom = useCallback(
    (code: string, profile: PlayerProfile) => {
      const resume = loadResume();
      send({
        type: "join_room",
        code: code.toUpperCase(),
        profile,
        resumePlayerId:
          resume && resume.roomCode === code.toUpperCase()
            ? resume.playerId
            : null,
      });
    },
    [send]
  );

  const leaveRoom = useCallback(() => {
    // User intent to leave — clear local resume immediately so a dropped
    // leave_room message can't resurrect them into the room on reconnect.
    wasInRoomRef.current = false;
    saveResume(null);
    send({ type: "leave_room" });
  }, [send]);
  const updateProfile = useCallback(
    (profile: PlayerProfile) => send({ type: "update_profile", profile }),
    [send]
  );
  const toggleReady = useCallback(() => send({ type: "toggle_ready" }), [send]);
  const updateSettings = useCallback(
    (settings: RoomSettings) => send({ type: "update_settings", settings }),
    [send]
  );
  const startGame = useCallback(() => send({ type: "start_game" }), [send]);
  const pick = useCallback(
    (country: string) => send({ type: "pick", country }),
    [send]
  );
  const nextRound = useCallback(() => send({ type: "next_round" }), [send]);
  const sendReaction = useCallback(
    (emoji: string) => send({ type: "reaction", emoji }),
    [send]
  );
  const rematch = useCallback(() => send({ type: "rematch" }), [send]);
  const forfeitOpponent = useCallback(
    () => send({ type: "forfeit_opponent" }),
    [send]
  );
  const clearError = useCallback(() => setError(null), []);
  const reset = useCallback(() => {
    wasInRoomRef.current = false;
    pendingResumeRef.current = false;
    setRoom(null);
    setPlayerId(null);
    setError(null);
    setReactions([]);
    saveResume(null);
    prefetchedRef.current.clear();
  }, []);

  return {
    status,
    room,
    playerId,
    error,
    reactions,
    createRoom,
    joinRoom,
    leaveRoom,
    updateProfile,
    toggleReady,
    updateSettings,
    startGame,
    pick,
    nextRound,
    sendReaction,
    rematch,
    forfeitOpponent,
    clearError,
    reset,
  };
}
