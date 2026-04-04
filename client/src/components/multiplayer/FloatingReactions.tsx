import { AnimatePresence, motion } from "framer-motion";
import type { FloatingReaction } from "../../lib/multiplayerTypes";

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
  selfId: string | null;
}

// Reactions float up from the bottom-left (self) or bottom-right (opponent).
// A small horizontal jitter keeps them from stacking identically.

// Deterministic jitter derived from the reaction id — pure, stable across renders.
function jitterFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return ((h % 100) - 50) * 0.5;
}

export function FloatingReactions({ reactions, selfId }: FloatingReactionsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      <AnimatePresence>
        {reactions.map((r) => {
          const isSelf = r.playerId === selfId;
          const jitter = jitterFromId(r.id);
          return (
            <motion.div
              key={r.id}
              initial={{
                opacity: 0,
                y: 20,
                x: jitter,
                scale: 0.6,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: -220,
                x: jitter + (isSelf ? -10 : 10),
                scale: [0.6, 1.25, 1.1, 1],
                rotate: isSelf ? -8 : 8,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: [0.16, 0.84, 0.32, 1] }}
              className="absolute bottom-[88px] text-[32px]"
              style={{
                left: isSelf ? "18%" : undefined,
                right: isSelf ? undefined : "18%",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))",
              }}
            >
              {r.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
