import { motion, AnimatePresence } from "framer-motion";

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <div className="h-5 flex items-center justify-center">
      <AnimatePresence>
        {streak >= 2 && (
          <motion.span
            key={streak}
            className="font-serif italic text-gold text-[14px] font-semibold"
            style={{ textShadow: "0 1px 6px rgba(196, 147, 90, 0.4)" }}
            initial={{ opacity: 0, scale: 0.8, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {streak} in a row
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
