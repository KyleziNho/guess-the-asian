import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ConnectionStatus } from "../../lib/multiplayerTypes";
import { haptic } from "../../lib/haptics";

interface ConnectionOverlayProps {
  status: ConnectionStatus;
}

/**
 * Tiny floating badge shown when the local socket is reconnecting.
 * Non-blocking; sits above the game board so the user always knows
 * what's happening, without ripping them out of the experience.
 */
export function ConnectionOverlay({ status }: ConnectionOverlayProps) {
  const visible = status === "reconnecting" || status === "disconnected";

  // Transition-based haptic: one heavy buzz on the drop, a gentle "back
  // online" chirp when we recover.
  const prevRef = useRef(status);
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = status;
    if (prev === status) return;
    if (status === "disconnected" && prev !== "disconnected") {
      haptic("disconnect");
    } else if (
      status === "connected" &&
      (prev === "reconnecting" || prev === "disconnected")
    ) {
      haptic("join");
    }
  }, [status]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md"
            style={{
              background: "rgba(28, 17, 8, 0.92)",
              border: "1px solid rgba(184, 92, 92, 0.5)",
              boxShadow:
                "0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(245, 237, 220, 0.08)",
            }}
          >
            <motion.span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "#B85C5C",
                boxShadow: "0 0 6px rgba(184, 92, 92, 0.8)",
              }}
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
            />
            <span
              className="text-[10px] tracking-[0.22em] uppercase font-semibold"
              style={{
                color: "rgba(245, 237, 220, 0.9)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              {status === "reconnecting"
                ? "Reconnecting…"
                : "Connection lost — retrying"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
