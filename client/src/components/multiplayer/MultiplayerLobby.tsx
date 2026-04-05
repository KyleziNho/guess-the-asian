import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  ConnectionStatus,
  PlayerProfile,
} from "../../lib/multiplayerTypes";
import { ProfileEditor } from "./ProfileEditor";
import { haptic } from "../../lib/haptics";

interface MultiplayerLobbyProps {
  profile: PlayerProfile;
  onProfileChange: (p: PlayerProfile) => void;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onBack: () => void;
  error: string | null;
  onClearError: () => void;
  status: ConnectionStatus;
}

export function MultiplayerLobby({
  profile,
  onProfileChange,
  onCreate,
  onJoin,
  onBack,
  error,
  onClearError,
  status,
}: MultiplayerLobbyProps) {
  const [mode, setMode] = useState<"choose" | "join">("choose");
  const [codeInput, setCodeInput] = useState("");
  const canAct = status === "connected" && profile.name.trim().length > 0;

  useEffect(() => {
    if (error) {
      haptic("error");
      const t = setTimeout(onClearError, 3500);
      return () => clearTimeout(t);
    }
  }, [error, onClearError]);

  const handleJoinSubmit = () => {
    if (codeInput.trim().length === 4) {
      haptic("select");
      onJoin(codeInput.trim().toUpperCase());
    }
  };

  return (
    <motion.div
      className="relative h-full w-full flex items-center justify-center overflow-hidden px-5 py-6 sm:px-8 sm:py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Reading halo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at center, rgba(18,12,6,0.7) 0%, rgba(18,12,6,0.5) 40%, rgba(18,12,6,0.15) 75%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-[440px] flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => {
              haptic("tap");
              onBack();
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
            Back
          </motion.button>

          <div className="flex items-center gap-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  status === "connected"
                    ? "#7CC4A3"
                    : status === "connecting" || status === "reconnecting"
                      ? "#DDB07C"
                      : "#B85C5C",
                boxShadow: `0 0 8px ${
                  status === "connected"
                    ? "rgba(124,196,163,0.8)"
                    : status === "connecting" || status === "reconnecting"
                      ? "rgba(221,176,124,0.8)"
                      : "rgba(184,92,92,0.8)"
                }`,
              }}
              animate={
                status === "connecting" || status === "reconnecting"
                  ? { opacity: [1, 0.4, 1] }
                  : { opacity: 1 }
              }
              transition={{ duration: 1.1, repeat: Infinity }}
            />
            <span
              className="text-[9px] tracking-[0.25em] uppercase font-semibold"
              style={{
                color: "rgba(245,237,220,0.55)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              {status === "connected"
                ? "Online"
                : status === "connecting"
                  ? "Connecting"
                  : status === "reconnecting"
                    ? "Reconnecting"
                    : "Offline"}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2.5">
            <span
              className="h-px w-8"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(221,176,124,0.6))",
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
              className="h-px w-8"
              style={{
                background:
                  "linear-gradient(to left, transparent, rgba(221,176,124,0.6))",
              }}
            />
          </div>
          <h2
            className="font-serif text-[32px] sm:text-[38px] font-bold text-parchment-solid leading-none"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
          >
            Two-Player <span className="italic text-gold">Duel</span>
          </h2>
          <p
            className="font-serif italic text-[12px] tracking-wide"
            style={{
              color: "rgba(245, 237, 220, 0.65)",
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            }}
          >
            Same round, same face, best pick wins
          </p>
        </div>

        {/* Profile editor */}
        <div
          className="rounded-2xl p-4 sm:p-5 backdrop-blur-md"
          style={{
            background: "rgba(28, 17, 8, 0.72)",
            border: "1px solid rgba(221, 176, 124, 0.25)",
            boxShadow:
              "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(245, 237, 220, 0.06)",
          }}
        >
          <ProfileEditor profile={profile} onChange={onProfileChange} />
        </div>

        {/* Actions */}
        <AnimatePresence mode="wait">
          {mode === "choose" ? (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <motion.button
                onClick={() => {
                  if (canAct) haptic("heavy");
                  onCreate();
                }}
                disabled={!canAct}
                className="relative w-full h-[52px] rounded-xl text-[14px] font-bold tracking-[0.18em] uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
                style={{
                  background:
                    "linear-gradient(to right, #1C1108, #6B4D25 20%, #B8863A 45%, #C4935A 50%, #B8863A 55%, #6B4D25 80%, #1C1108)",
                  border: "1.5px solid rgba(221, 176, 124, 0.5)",
                  boxShadow:
                    "inset 0 1px 0 rgba(245, 237, 220, 0.15), inset 0 0 0 3px rgba(28, 17, 8, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)",
                  color: "#F5EDDC",
                  textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
                }}
                whileHover={canAct ? { scale: 1.02 } : undefined}
                whileTap={canAct ? { scale: 0.98 } : undefined}
              >
                <span className="flex items-center justify-center gap-3">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Host a Room
                </span>
              </motion.button>

              <motion.button
                onClick={() => {
                  if (canAct) haptic("tap");
                  setMode("join");
                }}
                disabled={!canAct}
                className="w-full h-[52px] rounded-xl text-[13px] font-bold tracking-[0.18em] uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30,22,14,0.88), rgba(44,36,24,0.92))",
                  border: "1.5px solid rgba(221, 176, 124, 0.3)",
                  boxShadow:
                    "inset 0 1px 0 rgba(245,237,220,0.06), 0 4px 12px rgba(0,0,0,0.35)",
                  color: "rgba(245,237,220,0.92)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                }}
                whileHover={canAct ? { scale: 1.02 } : undefined}
                whileTap={canAct ? { scale: 0.98 } : undefined}
              >
                <span className="flex items-center justify-center gap-3">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                  Join with Code
                </span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-2">
                <label
                  className="text-[9px] tracking-[0.25em] uppercase font-semibold"
                  style={{
                    color: "rgba(245,237,220,0.6)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                  }}
                >
                  Room Code
                </label>
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => {
                    const next = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, "")
                      .slice(0, 4);
                    if (next.length !== codeInput.length) haptic("tick");
                    setCodeInput(next);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && codeInput.length === 4) {
                      handleJoinSubmit();
                    }
                  }}
                  autoFocus
                  placeholder="····"
                  className="w-full h-14 rounded-xl px-4 font-serif font-bold text-center text-[32px] tracking-[0.4em] outline-none"
                  style={{
                    background: "rgba(20, 14, 8, 0.8)",
                    border: "1.5px solid rgba(221, 176, 124, 0.45)",
                    color: "#F4CE8E",
                    textShadow: "0 1px 6px rgba(0,0,0,0.7)",
                    boxShadow:
                      "inset 0 2px 6px rgba(0,0,0,0.5), 0 0 0 0 rgba(221,176,124,0.4)",
                    transition: "box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.boxShadow =
                      "inset 0 2px 6px rgba(0,0,0,0.5), 0 0 16px rgba(221,176,124,0.4)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow =
                      "inset 0 2px 6px rgba(0,0,0,0.5), 0 0 0 0 rgba(221,176,124,0.4)";
                  }}
                />
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <motion.button
                  onClick={handleJoinSubmit}
                  disabled={codeInput.length !== 4 || !canAct}
                  className="h-[48px] rounded-xl text-[13px] font-bold tracking-[0.18em] uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(to right, #1C1108, #6B4D25 20%, #B8863A 45%, #C4935A 50%, #B8863A 55%, #6B4D25 80%, #1C1108)",
                    border: "1.5px solid rgba(221, 176, 124, 0.5)",
                    boxShadow:
                      "inset 0 1px 0 rgba(245, 237, 220, 0.15), inset 0 0 0 3px rgba(28, 17, 8, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)",
                    color: "#F5EDDC",
                    textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
                  }}
                  whileHover={
                    codeInput.length === 4 && canAct ? { scale: 1.02 } : undefined
                  }
                  whileTap={
                    codeInput.length === 4 && canAct ? { scale: 0.98 } : undefined
                  }
                >
                  Enter
                </motion.button>
                <motion.button
                  onClick={() => {
                    haptic("tap");
                    setMode("choose");
                    setCodeInput("");
                  }}
                  className="h-[48px] w-[48px] rounded-xl cursor-pointer"
                  style={{
                    background: "rgba(30, 22, 14, 0.6)",
                    border: "1.5px solid rgba(221, 176, 124, 0.2)",
                    color: "rgba(245,237,220,0.5)",
                  }}
                  whileHover={{
                    scale: 1.05,
                    color: "rgba(245,237,220,0.9)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Cancel"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
