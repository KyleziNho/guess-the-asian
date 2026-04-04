import { motion } from "framer-motion";
import type { Player } from "../../lib/multiplayerTypes";
import { getColorTheme } from "../../lib/multiplayerConstants";

interface PlayerCardProps {
  player: Player | null;
  isSelf: boolean;
  isHost: boolean;
  compact?: boolean;
  align?: "left" | "right";
  pickResult?: "correct" | "wrong" | null;
  pickedCountry?: string | null;
  showPickState?: boolean;
}

export function PlayerCard({
  player,
  isSelf,
  isHost,
  compact = false,
  align = "left",
  pickResult = null,
  pickedCountry = null,
  showPickState = false,
}: PlayerCardProps) {
  if (!player) {
    return (
      <div
        className={`${
          compact ? "h-[58px]" : "h-[84px]"
        } flex-1 rounded-xl flex items-center justify-center`}
        style={{
          background:
            "linear-gradient(135deg, rgba(30,22,14,0.5), rgba(44,36,24,0.45))",
          border: "1.5px dashed rgba(221, 176, 124, 0.25)",
        }}
      >
        <span
          className="text-[10px] tracking-[0.25em] uppercase font-semibold"
          style={{ color: "rgba(245,237,220,0.5)" }}
        >
          Waiting…
        </span>
      </div>
    );
  }

  const theme = getColorTheme(player.color);
  const borderColor =
    pickResult === "correct"
      ? "rgba(94, 140, 97, 0.75)"
      : pickResult === "wrong"
        ? "rgba(184, 92, 92, 0.75)"
        : `${theme.base}60`;
  const glow =
    pickResult === "correct"
      ? "0 0 18px rgba(94, 140, 97, 0.35)"
      : pickResult === "wrong"
        ? "0 0 18px rgba(184, 92, 92, 0.35)"
        : player.hasPicked
          ? `0 0 14px ${theme.glow}`
          : "none";

  const reverseRow = align === "right";

  return (
    <motion.div
      layout
      className={`${
        compact ? "h-[58px] px-3 py-2" : "h-[84px] px-4 py-3"
      } flex-1 rounded-xl relative overflow-hidden`}
      style={{
        background:
          "linear-gradient(135deg, rgba(30,22,14,0.88), rgba(44,36,24,0.92))",
        border: `1.5px solid ${borderColor}`,
        boxShadow: `${glow}, inset 0 1px 0 rgba(245,237,220,0.07)`,
        opacity: player.connected ? 1 : 0.55,
        transition:
          "border-color 0.25s ease, box-shadow 0.35s ease, opacity 0.25s ease",
      }}
    >
      {/* Accent stripe */}
      <div
        className="absolute inset-y-0 w-[3px]"
        style={{
          left: align === "left" ? 0 : undefined,
          right: align === "right" ? 0 : undefined,
          background: `linear-gradient(to bottom, transparent, ${theme.base}, transparent)`,
          boxShadow: `0 0 8px ${theme.glow}`,
        }}
      />

      <div
        className={`flex items-center gap-3 h-full ${
          reverseRow ? "flex-row-reverse text-right" : ""
        }`}
      >
        {/* Avatar orb */}
        <div
          className={`${
            compact ? "w-9 h-9 text-[22px]" : "w-12 h-12 text-[28px]"
          } rounded-full flex items-center justify-center flex-shrink-0 relative`}
          style={{
            background: `radial-gradient(circle at 35% 30%, ${theme.base}35, ${theme.dim}18 55%, transparent 85%)`,
            border: `1.5px solid ${theme.base}80`,
            boxShadow: `0 0 12px ${theme.glow}, inset 0 1px 0 rgba(245,237,220,0.12)`,
          }}
        >
          <span className="leading-none select-none">{player.avatar}</span>
          {!player.connected && (
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(20, 14, 8, 0.7)",
                backdropFilter: "blur(2px)",
              }}
            >
              <span className="text-[8px] tracking-[0.2em] uppercase font-bold text-parchment-solid">
                OFF
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div
          className={`flex flex-col min-w-0 ${
            reverseRow ? "items-end" : "items-start"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 ${
              reverseRow ? "flex-row-reverse" : ""
            }`}
          >
            <span
              className={`font-serif font-bold ${
                compact ? "text-[13px]" : "text-[15px]"
              } truncate max-w-[130px]`}
              style={{
                color: theme.base,
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}
            >
              {player.name}
            </span>
            {isSelf && (
              <span
                className="text-[8px] tracking-[0.2em] uppercase font-bold px-1.5 py-[2px] rounded"
                style={{
                  color: "rgba(245,237,220,0.85)",
                  background: "rgba(245,237,220,0.12)",
                  border: "1px solid rgba(245,237,220,0.15)",
                }}
              >
                You
              </span>
            )}
            {isHost && (
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill={theme.base}
                style={{ filter: `drop-shadow(0 0 4px ${theme.glow})` }}
              >
                <path d="M2 8 L6 12 L10 6 L12 4 L14 6 L18 12 L22 8 L20 18 L4 18 Z" />
              </svg>
            )}
          </div>

          {compact ? (
            <div
              className={`flex items-center gap-2 mt-[2px] ${
                reverseRow ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className="font-serif font-bold tabular-nums text-[18px]"
                style={{
                  color: "#F5EDDC",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                {player.score}
              </span>
              {player.streak > 1 && (
                <span
                  className="text-[10px] font-semibold tabular-nums"
                  style={{
                    color: "#F4CE8E",
                    textShadow: "0 0 6px rgba(244,206,142,0.5)",
                  }}
                >
                  🔥{player.streak}
                </span>
              )}
            </div>
          ) : (
            <div
              className={`flex items-baseline gap-2 ${
                reverseRow ? "flex-row-reverse" : ""
              }`}
            >
              <span
                className="font-serif font-bold tabular-nums text-[26px] leading-none"
                style={{
                  color: "#F5EDDC",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                {player.score}
              </span>
              {player.streak > 1 && (
                <span
                  className="text-[11px] font-semibold tabular-nums"
                  style={{
                    color: "#F4CE8E",
                    textShadow: "0 0 6px rgba(244,206,142,0.5)",
                  }}
                >
                  🔥{player.streak}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status indicator (in-game) */}
        {showPickState && !pickResult && (
          <div className={`${reverseRow ? "mr-auto" : "ml-auto"} flex-shrink-0`}>
            {player.hasPicked ? (
              <motion.div
                key="locked"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: `${theme.base}25`,
                  border: `1.5px solid ${theme.base}`,
                  boxShadow: `0 0 10px ${theme.glow}`,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.base}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="thinking"
                className="flex gap-[3px]"
                aria-label="thinking"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-[5px] h-[5px] rounded-full"
                    style={{ background: `${theme.base}CC` }}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: i * 0.15,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Revealed pick badge (reveal phase) */}
      {pickedCountry && pickResult && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute ${
            align === "left" ? "right-2" : "left-2"
          } top-2 text-[10px] font-semibold tracking-[0.1em] uppercase px-2 py-[3px] rounded-md`}
          style={{
            color:
              pickResult === "correct"
                ? "rgba(186, 222, 189, 0.98)"
                : "rgba(232, 182, 182, 0.98)",
            background:
              pickResult === "correct"
                ? "rgba(94, 140, 97, 0.22)"
                : "rgba(184, 92, 92, 0.22)",
            border: `1px solid ${
              pickResult === "correct"
                ? "rgba(94, 140, 97, 0.55)"
                : "rgba(184, 92, 92, 0.55)"
            }`,
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          }}
        >
          {pickedCountry}
        </motion.div>
      )}
    </motion.div>
  );
}
