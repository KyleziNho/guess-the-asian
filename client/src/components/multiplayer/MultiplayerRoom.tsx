import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  PlayerProfile,
  RoomState,
  RoomSettings,
} from "../../lib/multiplayerTypes";
import {
  MIN_ROUNDS,
  MAX_ROUNDS,
  getColorTheme,
} from "../../lib/multiplayerConstants";
import { ProfileEditor } from "./ProfileEditor";
import { haptic } from "../../lib/haptics";

interface MultiplayerRoomProps {
  room: RoomState;
  playerId: string;
  profile: PlayerProfile;
  onProfileChange: (p: PlayerProfile) => void;
  onToggleReady: () => void;
  onUpdateSettings: (s: RoomSettings) => void;
  onStart: () => void;
  onLeave: () => void;
  error: string | null;
  onClearError: () => void;
}

export function MultiplayerRoom({
  room,
  playerId,
  profile,
  onProfileChange,
  onToggleReady,
  onUpdateSettings,
  onStart,
  onLeave,
  error,
  onClearError,
}: MultiplayerRoomProps) {
  const self = room.players.find((p) => p.id === playerId);
  const opponent = room.players.find((p) => p.id !== playerId);
  const isHost = room.hostId === playerId;
  const [copied, setCopied] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    if (error) {
      haptic("error");
      const t = setTimeout(onClearError, 3200);
      return () => clearTimeout(t);
    }
  }, [error, onClearError]);

  // Opponent arrival / departure buzz.
  const opponentPresentRef = useRef<boolean>(!!opponent);
  useEffect(() => {
    const present = !!opponent;
    if (present !== opponentPresentRef.current) {
      opponentPresentRef.current = present;
      haptic(present ? "join" : "disconnect");
    }
  }, [opponent]);

  // Opponent ready state flip.
  const oppReadyRef = useRef<boolean>(opponent?.ready ?? false);
  useEffect(() => {
    const r = opponent?.ready ?? false;
    if (r !== oppReadyRef.current) {
      oppReadyRef.current = r;
      // Only buzz on the flip to "ready" — the un-ready flip is silent to
      // avoid spam when the opponent toggles back and forth.
      if (r) haptic("tick");
    }
  }, [opponent?.ready]);

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    haptic("success");
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const canStart =
    isHost &&
    room.players.length === 2 &&
    room.players.every((p) => p.ready && p.connected);

  const selfTheme = self ? getColorTheme(self.color) : getColorTheme("gold");
  const opponentTheme = opponent
    ? getColorTheme(opponent.color)
    : getColorTheme("gold");

  return (
    <motion.div
      className="relative h-full w-full flex items-center justify-center overflow-hidden px-5 py-5 sm:px-8 sm:py-7"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at center, rgba(18,12,6,0.7) 0%, rgba(18,12,6,0.5) 40%, rgba(18,12,6,0.15) 75%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-[460px] flex flex-col gap-4">
        {/* Header row: code + leave */}
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => {
              haptic("tap");
              onLeave();
            }}
            className="flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase font-semibold cursor-pointer"
            style={{
              color: "rgba(245, 237, 220, 0.55)",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
            }}
            whileHover={{ x: -2, color: "rgba(245, 237, 220, 0.9)" }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Leave
          </motion.button>

          <motion.button
            onClick={copyCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer backdrop-blur-md"
            style={{
              background: "rgba(28, 17, 8, 0.78)",
              border: "1px solid rgba(221, 176, 124, 0.4)",
              boxShadow:
                "0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 237, 220, 0.08)",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              className="text-[9px] tracking-[0.25em] uppercase font-semibold"
              style={{
                color: "rgba(245,237,220,0.7)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              Room
            </span>
            <span
              className="font-serif font-bold text-[18px] tracking-[0.3em] tabular-nums"
              style={{
                color: "#F4CE8E",
                textShadow: "0 1px 6px rgba(0,0,0,0.7)",
              }}
            >
              {room.code}
            </span>
            {copied ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7CC4A3"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(245,237,220,0.55)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </motion.button>
        </div>

        {/* Head-to-head player cards */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Self */}
          <BigPlayerCard
            name={self?.name || profile.name}
            avatar={self?.avatar || profile.avatar}
            themeId={self?.color || profile.color}
            ready={self?.ready ?? false}
            connected={self?.connected ?? true}
            isHost={isHost}
            label="You"
            align="left"
          />

          {/* VS divider */}
          <div className="flex flex-col items-center gap-1">
            <span
              className="h-8 w-px"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, rgba(221,176,124,0.4), transparent)",
              }}
            />
            <span
              className="font-serif italic text-[11px] tracking-[0.3em] uppercase"
              style={{
                color: "rgba(245,237,220,0.5)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              vs
            </span>
            <span
              className="h-8 w-px"
              style={{
                background:
                  "linear-gradient(to top, transparent, rgba(221,176,124,0.4), transparent)",
              }}
            />
          </div>

          {/* Opponent */}
          {opponent ? (
            <BigPlayerCard
              name={opponent.name}
              avatar={opponent.avatar}
              themeId={opponent.color}
              ready={opponent.ready}
              connected={opponent.connected}
              isHost={room.hostId === opponent.id}
              label={opponent.connected ? "Opponent" : "Reconnecting…"}
              align="right"
            />
          ) : (
            <WaitingCard />
          )}
        </div>

        {/* Profile editor (collapsible) */}
        <div
          className="rounded-2xl backdrop-blur-md overflow-hidden"
          style={{
            background: "rgba(28, 17, 8, 0.72)",
            border: "1px solid rgba(221, 176, 124, 0.22)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 237, 220, 0.05)",
          }}
        >
          <button
            onClick={() => setEditingProfile((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
          >
            <span
              className="text-[10px] tracking-[0.25em] uppercase font-semibold"
              style={{
                color: "rgba(245, 237, 220, 0.7)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              Customize
            </span>
            <motion.svg
              animate={{ rotate: editingProfile ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(245,237,220,0.55)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </motion.svg>
          </button>
          <AnimatePresence>
            {editingProfile && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4">
                  <ProfileEditor
                    profile={profile}
                    onChange={onProfileChange}
                    compact
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Round count (host only) or read-only indicator */}
        <div
          className="rounded-xl px-4 py-3 backdrop-blur-md flex items-center justify-between gap-3"
          style={{
            background: "rgba(28, 17, 8, 0.72)",
            border: "1px solid rgba(221, 176, 124, 0.22)",
          }}
        >
          <div className="flex flex-col">
            <span
              className="text-[9px] tracking-[0.25em] uppercase font-semibold"
              style={{
                color: "rgba(245, 237, 220, 0.6)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              Rounds
            </span>
            <span
              className="font-serif font-bold text-[20px] tabular-nums"
              style={{
                color: "#F4CE8E",
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}
            >
              {room.settings.rounds}
            </span>
          </div>
          {isHost ? (
            <div className="flex items-center gap-2 flex-1 max-w-[220px]">
              <RoundStepper
                value={room.settings.rounds}
                onChange={(rounds) => onUpdateSettings({ rounds })}
              />
            </div>
          ) : (
            <span
              className="text-[10px] tracking-[0.2em] uppercase font-semibold"
              style={{
                color: "rgba(245,237,220,0.45)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              Host's Choice
            </span>
          )}
        </div>

        {/* Ready / Start */}
        <div className="flex flex-col gap-2.5">
          <motion.button
            onClick={() => {
              // Flip haptic reflects the new state so "readying up" lands
              // heavier than "un-readying".
              haptic(self?.ready ? "tap" : "select");
              onToggleReady();
            }}
            className="w-full h-[52px] rounded-xl font-bold cursor-pointer overflow-hidden relative"
            style={{
              background: self?.ready
                ? `linear-gradient(135deg, ${selfTheme.base}30, ${selfTheme.dim}22)`
                : "linear-gradient(135deg, rgba(30,22,14,0.88), rgba(44,36,24,0.92))",
              border: `1.5px solid ${self?.ready ? selfTheme.base : "rgba(221,176,124,0.3)"}`,
              boxShadow: self?.ready
                ? `0 0 18px ${selfTheme.glow}, inset 0 1px 0 rgba(245,237,220,0.08)`
                : "inset 0 1px 0 rgba(245,237,220,0.06), 0 4px 12px rgba(0,0,0,0.35)",
              color: self?.ready ? selfTheme.base : "rgba(245,237,220,0.75)",
              textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              transition:
                "background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, color 0.25s ease",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-3 text-[13px] tracking-[0.2em] uppercase">
              {self?.ready ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>You're Ready</span>
                </>
              ) : (
                <span>Ready Up</span>
              )}
            </div>
          </motion.button>

          {isHost && (
            <motion.button
              onClick={() => {
                if (canStart) haptic("ready");
                onStart();
              }}
              disabled={!canStart}
              className="w-full h-[52px] rounded-xl font-bold tracking-[0.22em] uppercase text-[13px] cursor-pointer disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: canStart
                  ? "linear-gradient(to right, #1C1108, #6B4D25 20%, #B8863A 45%, #C4935A 50%, #B8863A 55%, #6B4D25 80%, #1C1108)"
                  : "rgba(30, 22, 14, 0.5)",
                border: canStart
                  ? "1.5px solid rgba(221, 176, 124, 0.55)"
                  : "1.5px solid rgba(221, 176, 124, 0.15)",
                boxShadow: canStart
                  ? "inset 0 1px 0 rgba(245, 237, 220, 0.15), inset 0 0 0 3px rgba(28, 17, 8, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)"
                  : "inset 0 1px 0 rgba(245,237,220,0.03)",
                color: canStart ? "#F5EDDC" : "rgba(245,237,220,0.3)",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
                opacity: canStart ? 1 : 0.75,
              }}
              whileHover={canStart ? { scale: 1.02 } : undefined}
              whileTap={canStart ? { scale: 0.98 } : undefined}
            >
              {canStart && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(245,237,220,0.28), transparent)",
                  }}
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                />
              )}
              <span className="relative flex items-center justify-center gap-3">
                <span
                  className="flex-1 h-px max-w-8"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(245, 237, 220, 0.3))",
                  }}
                />
                <span>
                  {room.players.length < 2
                    ? "Waiting for Opponent"
                    : !room.players.every((p) => p.ready)
                      ? "Both Must Ready Up"
                      : "Begin the Duel"}
                </span>
                <span
                  className="flex-1 h-px max-w-8"
                  style={{
                    background:
                      "linear-gradient(to left, transparent, rgba(245, 237, 220, 0.3))",
                  }}
                />
              </span>
            </motion.button>
          )}
          {!isHost && self?.ready && (
            <p
              className="text-center font-serif italic text-[12px] px-2"
              style={{
                color: "rgba(245, 237, 220, 0.65)",
                textShadow: "0 1px 4px rgba(0,0,0,0.7)",
              }}
            >
              Waiting for{" "}
              <span style={{ color: opponentTheme.base }}>{opponent?.name}</span>{" "}
              to begin…
            </p>
          )}
        </div>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="px-3 py-2 rounded-lg text-center"
              style={{
                background: "rgba(184, 92, 92, 0.18)",
                border: "1px solid rgba(184, 92, 92, 0.45)",
                color: "rgba(232, 182, 182, 0.98)",
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              <p className="text-[12px] font-semibold tracking-wide">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

interface BigPlayerCardProps {
  name: string;
  avatar: string;
  themeId: string;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
  label: string;
  align: "left" | "right";
}

function BigPlayerCard({
  name,
  avatar,
  themeId,
  ready,
  connected,
  isHost,
  label,
  align,
}: BigPlayerCardProps) {
  const theme = getColorTheme(themeId);
  return (
    <motion.div
      layout
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(30,22,14,0.88), rgba(44,36,24,0.92))",
        border: `1.5px solid ${ready ? theme.base : theme.base + "40"}`,
        boxShadow: ready
          ? `0 0 20px ${theme.glow}, inset 0 1px 0 rgba(245,237,220,0.08)`
          : "inset 0 1px 0 rgba(245,237,220,0.05), 0 4px 16px rgba(0,0,0,0.4)",
        opacity: connected ? 1 : 0.6,
        transition:
          "border-color 0.25s ease, box-shadow 0.3s ease, opacity 0.25s ease",
      }}
    >
      <div
        className="absolute inset-y-0 w-[3px]"
        style={{
          left: align === "left" ? 0 : undefined,
          right: align === "right" ? 0 : undefined,
          background: `linear-gradient(to bottom, transparent, ${theme.base}, transparent)`,
          boxShadow: `0 0 8px ${theme.glow}`,
        }}
      />

      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-[38px]"
            style={{
              background: `radial-gradient(circle at 35% 30%, ${theme.base}40, ${theme.dim}22 60%, transparent 90%)`,
              border: `2px solid ${theme.base}`,
              boxShadow: `0 0 18px ${theme.glow}, inset 0 2px 0 rgba(245,237,220,0.12)`,
            }}
          >
            <span className="leading-none select-none">{avatar}</span>
          </div>
          {isHost && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, #F4CE8E, #B8863A)`,
                border: "1.5px solid rgba(28, 17, 8, 0.8)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
              }}
              aria-label="Host"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="#1C1108"
              >
                <path d="M2 8 L6 12 L10 6 L12 4 L14 6 L18 12 L22 8 L20 18 L4 18 Z" />
              </svg>
            </div>
          )}
        </div>

        <span
          className="text-[8px] tracking-[0.25em] uppercase font-bold"
          style={{
            color: "rgba(245,237,220,0.5)",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          {label}
        </span>
        <p
          className="font-serif font-bold text-[15px] truncate max-w-full px-1"
          style={{
            color: theme.base,
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          {name || "—"}
        </p>

        <motion.div
          animate={{
            background: ready
              ? "rgba(94, 140, 97, 0.2)"
              : "rgba(245, 237, 220, 0.05)",
            borderColor: ready
              ? "rgba(94, 140, 97, 0.7)"
              : "rgba(245, 237, 220, 0.15)",
          }}
          transition={{ duration: 0.25 }}
          className="px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
          style={{ border: "1px solid" }}
        >
          <motion.span
            animate={{
              scale: ready ? 1 : 0.7,
              background: ready ? "#7CC4A3" : "rgba(245,237,220,0.4)",
            }}
            transition={{ duration: 0.25 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              boxShadow: ready ? "0 0 6px rgba(124,196,163,0.8)" : "none",
            }}
          />
          <span
            className="text-[9px] tracking-[0.2em] uppercase font-semibold"
            style={{
              color: ready ? "rgba(186, 222, 189, 0.98)" : "rgba(245,237,220,0.5)",
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            {ready ? "Ready" : "Not Ready"}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

function WaitingCard() {
  return (
    <motion.div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(30,22,14,0.6), rgba(44,36,24,0.55))",
        border: "1.5px dashed rgba(221, 176, 124, 0.3)",
        minHeight: 156,
      }}
    >
      <div className="flex flex-col items-center gap-2 justify-center h-full">
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(30, 22, 14, 0.6)",
            border: "1.5px dashed rgba(221, 176, 124, 0.3)",
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(221, 176, 124, 0.55)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </motion.div>
        <p
          className="font-serif italic text-[12px] text-center"
          style={{
            color: "rgba(245,237,220,0.55)",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          Share code for a rival
        </p>
      </div>
    </motion.div>
  );
}

interface RoundStepperProps {
  value: number;
  onChange: (n: number) => void;
}

function RoundStepper({ value, onChange }: RoundStepperProps) {
  const dec = () => {
    if (value > MIN_ROUNDS) haptic("tick");
    onChange(Math.max(MIN_ROUNDS, value - 5));
  };
  const inc = () => {
    if (value < MAX_ROUNDS) haptic("tick");
    onChange(Math.min(MAX_ROUNDS, value + 5));
  };
  return (
    <div className="flex items-center gap-1.5 ml-auto">
      <Stepper onClick={dec} disabled={value <= MIN_ROUNDS}>
        −
      </Stepper>
      <Stepper onClick={inc} disabled={value >= MAX_ROUNDS}>
        +
      </Stepper>
    </div>
  );
}

function Stepper({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      className="w-9 h-9 rounded-lg flex items-center justify-center font-serif font-bold text-[20px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
      style={{
        background:
          "linear-gradient(135deg, rgba(30,22,14,0.88), rgba(44,36,24,0.92))",
        border: "1.5px solid rgba(221, 176, 124, 0.35)",
        color: "#F4CE8E",
        textShadow: "0 1px 3px rgba(0,0,0,0.6)",
      }}
    >
      {children}
    </motion.button>
  );
}
