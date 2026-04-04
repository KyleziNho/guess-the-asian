import { useState } from "react";
import { motion } from "framer-motion";
import type { RoomState } from "../../lib/multiplayerTypes";
import { getColorTheme } from "../../lib/multiplayerConstants";
import { ConfettiEffect } from "../ConfettiEffect";

interface MultiplayerGameOverScreenProps {
  room: RoomState;
  playerId: string;
  onRematch: () => void;
  onLeave: () => void;
}

export function MultiplayerGameOverScreen({
  room,
  playerId,
  onRematch,
  onLeave,
}: MultiplayerGameOverScreenProps) {
  const self = room.players.find((p) => p.id === playerId);
  const opponent = room.players.find((p) => p.id !== playerId);
  const isHost = room.hostId === playerId;
  const [copied, setCopied] = useState(false);

  if (!self) return null;

  const selfScore = self.score;
  const oppScore = opponent?.score ?? 0;
  const outcome: "win" | "loss" | "tie" =
    selfScore > oppScore ? "win" : selfScore < oppScore ? "loss" : "tie";

  const selfTheme = getColorTheme(self.color);
  const oppTheme = opponent ? getColorTheme(opponent.color) : getColorTheme("gold");

  const heading =
    outcome === "win"
      ? "Victory"
      : outcome === "loss"
        ? "Defeat"
        : "Deadlock";
  const headingColor =
    outcome === "win"
      ? "#F4CE8E"
      : outcome === "loss"
        ? "rgba(232, 182, 182, 0.92)"
        : "rgba(245,237,220,0.9)";
  const headingSub =
    outcome === "win"
      ? `You outplayed ${opponent?.name ?? "your rival"}`
      : outcome === "loss"
        ? `${opponent?.name ?? "Your rival"} edged you out`
        : "A dead heat — both of you tied";

  const shareText = `Guess The Asian Duel · ${self.name} ${selfScore}–${oppScore} ${opponent?.name ?? "???"} (${room.totalRounds} rounds)`;

  const handleShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      className="h-full w-full flex items-center justify-center overflow-hidden px-5 py-6 sm:px-8 sm:py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-[460px] flex flex-col items-center gap-5">
        <ConfettiEffect fire={outcome === "win"} />

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="flex flex-col items-center gap-1.5"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="h-px w-10"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(221,176,124,0.55))",
              }}
            />
            <span
              className="w-1.5 h-1.5 rotate-45"
              style={{
                background: "#DDB07C",
                boxShadow: "0 0 6px rgba(221,176,124,0.7)",
              }}
            />
            <span
              className="h-px w-10"
              style={{
                background:
                  "linear-gradient(to left, transparent, rgba(221,176,124,0.55))",
              }}
            />
          </div>
          <h2
            className="font-serif text-[44px] sm:text-[52px] font-bold leading-none"
            style={{
              color: headingColor,
              textShadow: `0 0 22px ${headingColor}40, 0 2px 10px rgba(0,0,0,0.8)`,
            }}
          >
            {heading}
          </h2>
          <p
            className="font-serif italic text-[12px] sm:text-[13px] text-center px-2"
            style={{
              color: "rgba(245,237,220,0.68)",
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            }}
          >
            {headingSub}
          </p>
        </motion.div>

        {/* Score line */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="w-full rounded-2xl p-5 flex items-center gap-3 backdrop-blur-md"
          style={{
            background: "rgba(28, 17, 8, 0.72)",
            border: "1px solid rgba(221, 176, 124, 0.25)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(245,237,220,0.06)",
          }}
        >
          {/* Self column */}
          <ScorePlayerColumn
            name={self.name}
            avatar={self.avatar}
            theme={selfTheme}
            score={selfScore}
            bestStreak={self.bestStreak}
            winner={outcome === "win"}
            isSelf
          />

          {/* Score separator */}
          <div className="flex flex-col items-center px-2">
            <span
              className="font-serif italic text-[10px] tracking-[0.3em] uppercase"
              style={{
                color: "rgba(245,237,220,0.4)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              final
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif font-bold tabular-nums text-[38px] leading-none"
                style={{
                  color: outcome === "win" ? selfTheme.base : "rgba(245,237,220,0.7)",
                  textShadow: "0 2px 6px rgba(0,0,0,0.7)",
                }}
              >
                {selfScore}
              </span>
              <span
                className="text-[14px]"
                style={{ color: "rgba(245,237,220,0.35)" }}
              >
                —
              </span>
              <span
                className="font-serif font-bold tabular-nums text-[38px] leading-none"
                style={{
                  color: outcome === "loss" ? oppTheme.base : "rgba(245,237,220,0.7)",
                  textShadow: "0 2px 6px rgba(0,0,0,0.7)",
                }}
              >
                {oppScore}
              </span>
            </div>
            <span
              className="text-[9px] tracking-[0.25em] uppercase font-semibold"
              style={{
                color: "rgba(245,237,220,0.4)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              of {room.totalRounds}
            </span>
          </div>

          {/* Opponent column */}
          <ScorePlayerColumn
            name={opponent?.name ?? "—"}
            avatar={opponent?.avatar ?? "👤"}
            theme={oppTheme}
            score={oppScore}
            bestStreak={opponent?.bestStreak ?? 0}
            winner={outcome === "loss"}
            isSelf={false}
          />
        </motion.div>

        {/* Round-by-round breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="w-full"
        >
          <RoundGrid
            room={room}
            selfId={playerId}
            selfColor={selfTheme.base}
            oppColor={oppTheme.base}
          />
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          className="w-full flex flex-col gap-2.5"
        >
          {isHost ? (
            <motion.button
              onClick={onRematch}
              className="w-full h-[52px] rounded-xl text-[13px] font-bold tracking-[0.2em] uppercase cursor-pointer relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(to right, #1C1108, #6B4D25 20%, #B8863A 45%, #C4935A 50%, #B8863A 55%, #6B4D25 80%, #1C1108)",
                border: "1.5px solid rgba(221, 176, 124, 0.55)",
                boxShadow:
                  "inset 0 1px 0 rgba(245, 237, 220, 0.15), inset 0 0 0 3px rgba(28, 17, 8, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)",
                color: "#F5EDDC",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center gap-3">
                <span
                  className="flex-1 h-px max-w-8"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(245, 237, 220, 0.3))",
                  }}
                />
                <span>Rematch</span>
                <span
                  className="flex-1 h-px max-w-8"
                  style={{
                    background:
                      "linear-gradient(to left, transparent, rgba(245, 237, 220, 0.3))",
                  }}
                />
              </div>
            </motion.button>
          ) : (
            <div
              className="w-full h-[52px] rounded-xl flex items-center justify-center gap-2"
              style={{
                background: "rgba(30, 22, 14, 0.62)",
                border: "1.5px solid rgba(221, 176, 124, 0.2)",
              }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#DDB07C",
                  boxShadow: "0 0 8px rgba(221,176,124,0.7)",
                }}
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span
                className="text-[11px] tracking-[0.2em] uppercase font-semibold"
                style={{
                  color: "rgba(245,237,220,0.7)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                }}
              >
                Waiting on {opponent?.name ?? "host"} for rematch
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <motion.button
              onClick={handleShare}
              className="h-11 rounded-xl text-[12px] font-semibold tracking-wide cursor-pointer"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30,22,14,0.85), rgba(44,36,24,0.9))",
                border: "1.5px solid rgba(196, 147, 90, 0.25)",
                boxShadow:
                  "inset 0 1px 0 rgba(245, 237, 220, 0.06), 0 2px 8px rgba(0,0,0,0.3)",
                color: "#F5EDDC",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {copied ? "Copied!" : "Share"}
            </motion.button>
            <motion.button
              onClick={onLeave}
              className="h-11 rounded-xl text-[12px] font-semibold tracking-wide cursor-pointer"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30,22,14,0.85), rgba(44,36,24,0.9))",
                border: "1.5px solid rgba(196, 147, 90, 0.15)",
                boxShadow:
                  "inset 0 1px 0 rgba(245, 237, 220, 0.04), 0 2px 8px rgba(0,0,0,0.3)",
                color: "rgba(245, 237, 220, 0.55)",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Leave
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

interface ScorePlayerColumnProps {
  name: string;
  avatar: string;
  theme: ReturnType<typeof getColorTheme>;
  score: number;
  bestStreak: number;
  winner: boolean;
  isSelf: boolean;
}

function ScorePlayerColumn({
  name,
  avatar,
  theme,
  bestStreak,
  winner,
  isSelf,
}: ScorePlayerColumnProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0 relative">
      {winner && (
        <motion.div
          initial={{ y: 6, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 18 }}
          className="absolute -top-4"
          style={{
            filter: `drop-shadow(0 2px 6px ${theme.glow})`,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={theme.base}>
            <path d="M2 8 L6 12 L10 6 L12 4 L14 6 L18 12 L22 8 L20 18 L4 18 Z" />
          </svg>
        </motion.div>
      )}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-[28px]"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${theme.base}35, ${theme.dim}18 60%, transparent 90%)`,
          border: `2px solid ${theme.base}${winner ? "" : "80"}`,
          boxShadow: winner
            ? `0 0 20px ${theme.glow}, inset 0 2px 0 rgba(245,237,220,0.12)`
            : `0 0 10px ${theme.glow}, inset 0 2px 0 rgba(245,237,220,0.08)`,
        }}
      >
        <span className="leading-none select-none">{avatar}</span>
      </div>
      <p
        className="font-serif font-bold text-[13px] truncate max-w-full px-1"
        style={{
          color: theme.base,
          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
        }}
      >
        {name}
      </p>
      {bestStreak > 1 && (
        <p
          className="text-[9px] tabular-nums font-semibold"
          style={{
            color: "rgba(244, 206, 142, 0.85)",
            textShadow: "0 0 6px rgba(244,206,142,0.4)",
          }}
        >
          🔥{bestStreak}
        </p>
      )}
      {isSelf && (
        <p
          className="text-[8px] tracking-[0.2em] uppercase font-semibold"
          style={{
            color: "rgba(245,237,220,0.35)",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          You
        </p>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

interface RoundGridProps {
  room: RoomState;
  selfId: string;
  selfColor: string;
  oppColor: string;
}

function RoundGrid({ room, selfId, selfColor, oppColor }: RoundGridProps) {
  const opponentId = room.players.find((p) => p.id !== selfId)?.id;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span
          className="text-[9px] tracking-[0.25em] uppercase font-semibold"
          style={{
            color: "rgba(245,237,220,0.55)",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          Round-by-Round
        </span>
        <div className="flex items-center gap-3">
          <Legend color={selfColor} label="You" />
          <Legend color={oppColor} label="Rival" />
        </div>
      </div>
      <div className="flex gap-1">
        {room.history.map((round, i) => {
          const selfCorr = round.correct[selfId] ?? false;
          const oppCorr = opponentId
            ? (round.correct[opponentId] ?? false)
            : false;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col gap-0.5"
              title={`Round ${i + 1}`}
            >
              <div
                className="h-2.5 rounded-sm"
                style={{
                  background: selfCorr ? selfColor : "rgba(245,237,220,0.08)",
                  boxShadow: selfCorr ? `0 0 5px ${selfColor}50` : "none",
                  border: selfCorr
                    ? `1px solid ${selfColor}`
                    : "1px solid rgba(245,237,220,0.1)",
                }}
              />
              <div
                className="h-2.5 rounded-sm"
                style={{
                  background: oppCorr ? oppColor : "rgba(245,237,220,0.08)",
                  boxShadow: oppCorr ? `0 0 5px ${oppColor}50` : "none",
                  border: oppCorr
                    ? `1px solid ${oppColor}`
                    : "1px solid rgba(245,237,220,0.1)",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="w-2 h-2 rounded-sm"
        style={{
          background: color,
          boxShadow: `0 0 4px ${color}80`,
        }}
      />
      <span
        className="text-[8px] tracking-[0.2em] uppercase font-semibold"
        style={{
          color: "rgba(245,237,220,0.55)",
          textShadow: "0 1px 3px rgba(0,0,0,0.7)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
