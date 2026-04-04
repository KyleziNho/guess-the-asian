import { motion } from "framer-motion";
import { TOTAL_ROUNDS } from "../lib/constants";
import type { RoundResult } from "../lib/types";

interface ProgressBarProps {
  results: RoundResult[];
  currentRound: number;
}

export function ProgressBar({ results, currentRound }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
        const result = results[i];
        const isCurrent = i === currentRound && !result;
        const isPast = result !== undefined;

        let bg = "bg-parchment-solid/15";
        let ring = "";
        if (result) {
          bg = result.correct ? "bg-correct" : "bg-wrong";
        } else if (isCurrent) {
          bg = "bg-gold/60";
          ring = "ring-1 ring-gold/30";
        }

        return (
          <motion.div
            key={i}
            className={`rounded-full transition-colors duration-300 ${bg} ${ring}`}
            style={{
              width: isCurrent ? 10 : 8,
              height: isCurrent ? 10 : 8,
            }}
            initial={isPast ? { scale: 0 } : {}}
            animate={{ scale: 1 }}
            transition={
              isPast
                ? { type: "spring", stiffness: 500, damping: 25 }
                : { duration: 0.2 }
            }
          />
        );
      })}
    </div>
  );
}
