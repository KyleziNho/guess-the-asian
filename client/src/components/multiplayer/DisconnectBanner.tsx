import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Player } from "../../lib/multiplayerTypes";
import { getColorTheme } from "../../lib/multiplayerConstants";

interface DisconnectBannerProps {
  opponent: Player | null;
  graceMs: number;
  onForfeit: () => void;
  /** true when opponent has been forfeited into solo mode */
  soloMode: boolean;
}

/**
 * Inline banner shown in-game when the opponent has dropped.
 * - Ticks down a 2-minute grace countdown
 * - Offers a quick "Claim Win" forfeit option
 * - Once solo mode is active, shifts to a subtle "flying solo" note
 */
export function DisconnectBanner({
  opponent,
  graceMs,
  onForfeit,
  soloMode,
}: DisconnectBannerProps) {
  const [now, setNow] = useState(() => Date.now());

  const dcActive = !!opponent && !opponent.connected && !soloMode;
  const show = dcActive || soloMode;

  useEffect(() => {
    if (!dcActive) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [dcActive]);

  if (!opponent) return null;

  const theme = getColorTheme(opponent.color);
  const disconnectedAt = opponent.disconnectedAt ?? now;
  const remainingMs = Math.max(0, graceMs - (now - disconnectedAt));
  const totalSec = Math.ceil(remainingMs / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const fmt = `${mins}:${secs.toString().padStart(2, "0")}`;
  const progress = Math.max(0, Math.min(1, remainingMs / graceMs));
  const urgent = remainingMs < 20_000;

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key={soloMode ? "solo" : "dc"}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden"
        >
          {soloMode ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full mx-auto w-fit backdrop-blur-md"
              style={{
                background: "rgba(28, 17, 8, 0.82)",
                border: "1px solid rgba(221, 176, 124, 0.35)",
                boxShadow:
                  "0 4px 18px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(245, 237, 220, 0.08)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#DDB07C",
                  boxShadow: "0 0 6px rgba(221,176,124,0.7)",
                }}
              />
              <span
                className="font-serif italic text-[11px] sm:text-[12px]"
                style={{
                  color: "rgba(245,237,220,0.85)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                }}
              >
                Flying solo — {opponent.name} forfeited
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-xl backdrop-blur-md"
              style={{
                background: "rgba(28, 17, 8, 0.88)",
                border: "1px solid rgba(184, 92, 92, 0.5)",
                boxShadow:
                  "0 8px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(184, 92, 92, 0.2), inset 0 1px 0 rgba(245, 237, 220, 0.08)",
              }}
            >
              <motion.span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background: "#B85C5C",
                  boxShadow: "0 0 8px rgba(184, 92, 92, 0.8)",
                }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="font-serif font-bold text-[12px] truncate"
                    style={{
                      color: theme.base,
                      textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                    }}
                  >
                    {opponent.name}
                  </span>
                  <span
                    className="text-[9px] tracking-[0.15em] uppercase font-semibold"
                    style={{
                      color: "rgba(245,237,220,0.6)",
                      textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                    }}
                  >
                    reconnecting
                  </span>
                  <span
                    className="ml-auto font-serif font-bold tabular-nums text-[12px]"
                    style={{
                      color: urgent ? "#E8B6B6" : "#F4CE8E",
                      textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                    }}
                  >
                    {fmt}
                  </span>
                </div>
                <div
                  className="h-[3px] rounded-full overflow-hidden"
                  style={{ background: "rgba(245, 237, 220, 0.08)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                    style={{
                      background: urgent
                        ? "linear-gradient(to right, #B85C5C, #D48BA7)"
                        : "linear-gradient(to right, #DDB07C, #F4CE8E)",
                      boxShadow: urgent
                        ? "0 0 8px rgba(184,92,92,0.6)"
                        : "0 0 8px rgba(221,176,124,0.5)",
                    }}
                  />
                </div>
              </div>
              <motion.button
                onClick={onForfeit}
                className="flex-shrink-0 h-8 px-3 rounded-md text-[9px] font-bold tracking-[0.18em] uppercase cursor-pointer whitespace-nowrap"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30,22,14,0.9), rgba(44,36,24,0.95))",
                  border: "1px solid rgba(221, 176, 124, 0.4)",
                  color: "#F4CE8E",
                  textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                }}
                whileHover={{
                  scale: 1.04,
                  borderColor: "rgba(221, 176, 124, 0.7)",
                  boxShadow: "0 0 12px rgba(221,176,124,0.35)",
                }}
                whileTap={{ scale: 0.96 }}
              >
                Claim Win
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
