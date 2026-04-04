import { motion, AnimatePresence } from "framer-motion";

interface ScoreBoardProps {
  score: number;
  round: number;
  totalRounds: number;
}

export function ScoreBoard({ score, round, totalRounds }: ScoreBoardProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <span
          className="font-serif italic text-[13px]"
          style={{ color: "rgba(245, 237, 220, 0.5)" }}
        >
          Round
        </span>
        <span
          className="font-serif text-[28px] font-bold leading-none text-parchment-solid tabular-nums"
          style={{ textShadow: "0 2px 6px rgba(0, 0, 0, 0.5)" }}
        >
          {round + 1}
        </span>
        <span
          className="font-serif italic text-[15px] font-light"
          style={{ color: "rgba(196, 147, 90, 0.5)" }}
        >
          of {totalRounds}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            className="font-serif text-[28px] font-bold leading-none text-gold tabular-nums"
            style={{ textShadow: "0 2px 6px rgba(0, 0, 0, 0.5)" }}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {score}
          </motion.span>
        </AnimatePresence>
        <span
          className="font-serif italic text-[13px]"
          style={{ color: "rgba(196, 147, 90, 0.4)" }}
        >
          pts
        </span>
      </div>
    </div>
  );
}
