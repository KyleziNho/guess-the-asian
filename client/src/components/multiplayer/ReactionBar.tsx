import { useRef } from "react";
import { motion } from "framer-motion";
import {
  REACTION_EMOJIS,
  REACTION_RATE_LIMIT_MS,
} from "../../lib/multiplayerConstants";
import { haptic } from "../../lib/haptics";

interface ReactionBarProps {
  onSend: (emoji: string) => void;
}

export function ReactionBar({ onSend }: ReactionBarProps) {
  const canSendRef = useRef(true);

  const handleSend = (emoji: string) => {
    if (!canSendRef.current) return;
    canSendRef.current = false;
    haptic("reaction");
    onSend(emoji);
    setTimeout(() => {
      canSendRef.current = true;
    }, REACTION_RATE_LIMIT_MS);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.25 }}
      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md"
      style={{
        background: "rgba(28, 17, 8, 0.85)",
        border: "1px solid rgba(221, 176, 124, 0.3)",
        boxShadow:
          "0 4px 18px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(245, 237, 220, 0.08)",
      }}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          onClick={() => handleSend(emoji)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[18px] cursor-pointer"
          style={{ background: "transparent" }}
          whileHover={{
            scale: 1.25,
            background: "rgba(245, 237, 220, 0.08)",
          }}
          whileTap={{ scale: 0.85 }}
          aria-label={`react ${emoji}`}
        >
          <span className="leading-none">{emoji}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
