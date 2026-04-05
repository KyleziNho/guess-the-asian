import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameState } from "../lib/types";
import { TOTAL_ROUNDS, RESULT_DISPLAY_MS } from "../lib/constants";
import { PhotoCard } from "./PhotoCard";
import { CountryButtons } from "./CountryButtons";
import { haptic } from "../lib/haptics";

interface GameScreenProps {
  state: GameState;
  onGuess: (country: string) => void;
  onNextRound: () => void;
  onExit: () => void;
}

export function GameScreen({ state, onGuess, onNextRound, onExit }: GameScreenProps) {
  const person = state.people[state.currentRound];
  const options = state.options[state.currentRound];
  const isResult = state.phase === "result";

  // Round-advance tick — fires a soft pulse as each progress segment fills.
  const prevRoundRef = useRef(state.currentRound);
  useEffect(() => {
    if (state.currentRound !== prevRoundRef.current) {
      prevRoundRef.current = state.currentRound;
      haptic("tick");
    }
  }, [state.currentRound]);

  // Auto-advance timer
  useEffect(() => {
    if (isResult) {
      const timer = setTimeout(onNextRound, RESULT_DISPLAY_MS);
      return () => clearTimeout(timer);
    }
  }, [isResult, onNextRound]);

  const borderGlow = isResult
    ? state.lastGuessCorrect
      ? "ring-2 ring-correct/60 shadow-[0_0_24px_rgba(94,140,97,0.3)]"
      : "ring-2 ring-wrong/60 shadow-[0_0_24px_rgba(184,92,92,0.3)]"
    : "ring-1 ring-gold-dim/20";

  return (
    <motion.div
      className="h-full w-full flex items-center justify-center overflow-hidden px-5 py-5 sm:px-8 sm:py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-[460px] flex flex-col gap-4 sm:gap-5">
        {/* Progress bar + exit */}
        <div className="flex justify-center items-center gap-3">
          <div className="flex-1 max-w-[320px] flex items-center gap-1.5">
            {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => {
              const isPast = i < state.currentRound;
              const isCurrent = i === state.currentRound;
              return (
                <div
                  key={i}
                  className="h-[3px] flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: isPast
                      ? "#DDB07C"
                      : isCurrent
                        ? "rgba(221, 176, 124, 0.55)"
                        : "rgba(245, 237, 220, 0.1)",
                    boxShadow: isCurrent
                      ? "0 0 8px rgba(221, 176, 124, 0.5)"
                      : undefined,
                  }}
                />
              );
            })}
          </div>
          <motion.button
            onClick={() => {
              haptic("tap");
              onExit();
            }}
            aria-label="Exit to home"
            className="flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-colors duration-200"
            style={{
              color: "rgba(245, 237, 220, 0.45)",
            }}
            whileHover={{ scale: 1.1, color: "rgba(245, 237, 220, 0.9)" }}
            whileTap={{ scale: 0.9 }}
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </motion.button>
        </div>

        {/* Photo with floating pill */}
        <div
          className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 ${borderGlow}`}
          style={{
            height: "clamp(340px, 62vh, 680px)",
            boxShadow: isResult
              ? undefined
              : "0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          <PhotoCard person={person} roundKey={state.currentRound} />

          {/* Floating prompt/result pill */}
          <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-10 px-4">
            <AnimatePresence mode="wait">
              {!isResult ? (
                <motion.div
                  key="prompt"
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-1 rounded-full backdrop-blur-md"
                  style={{
                    background: "rgba(28, 17, 8, 0.72)",
                    border: "1px solid rgba(221, 176, 124, 0.3)",
                    boxShadow:
                      "0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 237, 220, 0.08)",
                  }}
                >
                  <p
                    className="font-serif italic text-[12px] sm:text-[13px] whitespace-nowrap"
                    style={{
                      color: "rgba(245, 237, 220, 0.92)",
                      textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    Where are they from?
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 py-1 rounded-full backdrop-blur-md"
                  style={{
                    background: "rgba(28, 17, 8, 0.78)",
                    border: `1px solid ${
                      state.lastGuessCorrect
                        ? "rgba(94, 140, 97, 0.6)"
                        : "rgba(184, 92, 92, 0.6)"
                    }`,
                    boxShadow: state.lastGuessCorrect
                      ? "0 4px 16px rgba(0, 0, 0, 0.4), 0 0 16px rgba(94, 140, 97, 0.3)"
                      : "0 4px 16px rgba(0, 0, 0, 0.4), 0 0 16px rgba(184, 92, 92, 0.3)",
                  }}
                >
                  <p
                    className="font-serif italic text-[12px] sm:text-[13px] whitespace-nowrap flex items-center gap-1.5"
                    style={{
                      color: "rgba(245, 237, 220, 0.96)",
                      textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={
                        state.lastGuessCorrect
                          ? "rgba(186, 222, 189, 0.98)"
                          : "rgba(232, 182, 182, 0.98)"
                      }
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      {state.lastGuessCorrect ? (
                        <polyline points="20 6 9 17 4 12" />
                      ) : (
                        <>
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </>
                      )}
                    </svg>
                    <span>
                      They're from{" "}
                      <span
                        style={{
                          color: state.lastGuessCorrect
                            ? "rgba(186, 222, 189, 0.98)"
                            : "rgba(232, 182, 182, 0.98)",
                        }}
                      >
                        {person.country}
                      </span>
                    </span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Country buttons */}
        <CountryButtons
          options={options}
          onGuess={onGuess}
          disabled={isResult}
          correctCountry={isResult ? person.country : undefined}
          guessedCountry={
            isResult
              ? state.results[state.results.length - 1]?.guess
              : undefined
          }
        />
      </div>
    </motion.div>
  );
}
