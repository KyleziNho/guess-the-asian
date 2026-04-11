import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RoundResult } from "../lib/types";
import { TOTAL_ROUNDS } from "../lib/constants";
import { ConfettiEffect } from "./ConfettiEffect";
import { haptic, hapticScroll } from "../lib/haptics";
import { formatSoloShare, shareResult } from "../lib/share";

interface GameOverScreenProps {
  score: number;
  bestStreak: number;
  results: RoundResult[];
  highScore: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

// Score → percentile of players you beat (plausible distribution).
// Index by score (0..10).
const PERCENTILE_TABLE = [0, 3, 9, 19, 31, 46, 61, 76, 88, 95, 99];

// Score percentage → pool of flavor reactions. One is picked at random per game.
const FLAVOR_POOLS: { max: number; lines: string[] }[] = [
  {
    max: 10,
    lines: [
      "Just put the fries in the bag bro 🍟",
      "Cooked beyond repair. Absolute zero. 💀",
    ],
  },
  {
    max: 20,
    lines: [
      "Negative aura points generated 📉",
      "Bro is playing with the monitor off 😭",
    ],
  },
  {
    max: 30,
    lines: [
      "Who let you cook? The kitchen is on fire 🚒",
      "Giving absolute flop energy rn 🥱",
    ],
  },
  {
    max: 39,
    lines: [
      "Major skill issue tbh 🤡",
      "Down horrendous, but there's a tiny bit of hope 📉",
    ],
  },
  {
    max: 49,
    lines: [
      "Aggressively mid. Not the worst, but definitely not the best. 😐",
      "Surviving, not thriving 🛶",
    ],
  },
  {
    max: 59,
    lines: [
      "Passing the vibe check. Lowkey a solid run. 🤏",
      "We love a little character development 📈",
    ],
  },
  {
    max: 69,
    lines: [
      "Valid. You're actually kinda cooking now. 🍳",
      "Kinda eating this up ngl 🍽️",
    ],
  },
  {
    max: 79,
    lines: [
      "Okay, I see you! Unironically popping off 🔥",
      "Main character moment! 🎬",
    ],
  },
  {
    max: 89,
    lines: [
      "Left absolutely zero crumbs. Big brain energy fr 🧠",
      "Built different. Actually goated with the sauce 🐐",
    ],
  },
  {
    max: 100,
    lines: [
      "Infinite aura. YOU ARE OFFICIALLY HIM 👑",
      "Literally the blueprint. Hang this score in the Louvre 🖼️",
    ],
  },
];

function pickFlavorLine(percentage: number): string {
  const pool = FLAVOR_POOLS.find((p) => percentage <= p.max) ?? FLAVOR_POOLS[0];
  return pool.lines[Math.floor(Math.random() * pool.lines.length)];
}

// Score → rank identity. Colors stay bright enough to read on the warm bg.
function getRank(
  score: number,
): { title: string; subtitle: string; color: string } {
  if (score === 10)
    return {
      title: "GOOGLE MAPS STREET VIEW CAR",
      subtitle: "You've seen every road",
      color: "#F4CE8E",
    };
  if (score >= 8)
    return {
      title: "MR. WORLDWIDE",
      subtitle: "Pitbull would be proud",
      color: "#EDC285",
    };
  if (score === 7)
    return {
      title: "GEO-GUESSER SWEAT",
      subtitle: "Recognizes dirt patterns",
      color: "#E8BD7F",
    };
  if (score === 6)
    return {
      title: "CULTURE VULTURE",
      subtitle: "Owns one pair of harem pants",
      color: "#DDB07C",
    };
  if (score >= 4)
    return {
      title: "FREQUENT FLYER",
      subtitle: "Knows their way around an airport",
      color: "#D4A366",
    };
  if (score >= 2)
    return {
      title: "ECONOMY CLASS",
      subtitle: "Just happy to be here",
      color: "#CD9A58",
    };
  if (score === 1)
    return {
      title: "LOST TOURIST",
      subtitle: "Looking for the nearest McDonald's",
      color: "#C58C50",
    };
  return {
    title: "BASEMENT DWELLER",
    subtitle: "Has never seen the sun",
    color: "#B87A40",
  };
}

export function GameOverScreen({
  score,
  bestStreak,
  results,
  highScore,
  onPlayAgain,
  onHome,
}: GameOverScreenProps) {
  const percentage = Math.round((score / TOTAL_ROUNDS) * 100);
  const percentile = PERCENTILE_TABLE[score] ?? 0;
  const [displayPercent, setDisplayPercent] = useState(0);
  const [displayPercentile, setDisplayPercentile] = useState(0);
  const isNewHighScore = score > highScore && score > 0;
  const [shareLabel, setShareLabel] = useState<"Share" | "Copied!" | "Shared!">("Share");
  const rank = getRank(score);
  // Pick a flavor line once per mount so it stays stable across re-renders.
  const [flavorLine] = useState(() => pickFlavorLine(percentage));

  // Synchronised count-up: percentage ring + percentile both animate together
  useEffect(() => {
    const startDelay = setTimeout(() => {
      const duration = 900;
      const steps = 36;
      const stepTime = duration / steps;
      // Scrolling haptic — one steady pattern for the whole fill so the
      // ratcheting ticks stay locked to the visual count-up.
      const cancelScroll = hapticScroll(duration, Math.min(steps, 24));
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep += 1;
        const t = Math.min(currentStep / steps, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayPercent(Math.round(eased * percentage));
        setDisplayPercentile(Math.round(eased * percentile));
        if (currentStep >= steps) {
          clearInterval(interval);
          // Punctuate the landing with a firm thump.
          haptic(percentage >= 80 ? "victory" : percentage >= 40 ? "success" : "heavy");
        }
      }, stepTime);
      return () => {
        clearInterval(interval);
        cancelScroll();
      };
    }, 200);
    return () => clearTimeout(startDelay);
  }, [percentage, percentile]);

  const handleShare = async () => {
    haptic("success");
    const data = formatSoloShare(score, results, bestStreak, rank.title);
    const result = await shareResult(data);
    setShareLabel(result === "shared" ? "Shared!" : "Copied!");
    setTimeout(() => setShareLabel("Share"), 2000);
  };

  const getCTASubtitle = () => {
    if (isNewHighScore && highScore > 0) return "Can you do it again?";
    if (score === highScore && score > 0) return "Tie your best — or beat it";
    if (highScore === 0) return "Your first score. Beat it.";
    return "";
  };

  // Ring geometry
  const size = 220;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      className="h-full w-full flex items-center justify-center overflow-hidden px-5 py-6 sm:px-8 sm:py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-[420px] flex flex-col items-center gap-5">
        <ConfettiEffect fire={score >= 8} />

        {/* New personal best banner */}
        {isNewHighScore && (
          <motion.div
            className="relative overflow-hidden rounded-full px-4 py-1"
            initial={{ opacity: 0, scale: 0.8, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
            style={{
              background:
                "linear-gradient(90deg, rgba(221,176,124,0.15), rgba(221,176,124,0.35), rgba(221,176,124,0.15))",
              border: "1px solid rgba(221, 176, 124, 0.5)",
              boxShadow: "0 0 20px rgba(221, 176, 124, 0.3)",
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(245,237,220,0.4), transparent)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeInOut" }}
            />
            <p
              className="relative text-[10px] font-bold tracking-[0.25em] uppercase"
              style={{
                color: "#F4CE8E",
                textShadow: "0 1px 4px rgba(0,0,0,0.5)",
              }}
            >
              ✦ New Personal Best ✦
            </p>
          </motion.div>
        )}

        {/* Rank title */}
        <motion.div
          className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: isNewHighScore ? 0.25 : 0.05, duration: 0.35 }}
        >
          <p
            className="text-[9px] tracking-[0.3em] uppercase"
            style={{
              color: "rgba(245, 237, 220, 0.7)",
              textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            }}
          >
            Your Rank
          </p>
          <p
            className="font-serif text-[15px] sm:text-[17px] tracking-[0.1em] font-bold text-center px-2"
            style={{
              color: rank.color,
              textShadow: `0 0 18px ${rank.color}60, 0 2px 8px rgba(0,0,0,0.8), 0 1px 2px rgba(0,0,0,0.9)`,
            }}
          >
            {rank.title}
          </p>
          <p
            className="font-serif italic text-[11px] sm:text-[12px] text-center px-2 mt-0.5"
            style={{
              color: "rgba(245, 237, 220, 0.65)",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {rank.subtitle}
          </p>
        </motion.div>

        {/* Circular percentage ring */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="relative" style={{ width: size, height: size }}>
            <svg
              width={size}
              height={size}
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(221, 176, 124, 0.15)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={rank.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{
                  delay: 0.3,
                  duration: 0.9,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{
                  filter: `drop-shadow(0 0 12px ${rank.color}80)`,
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <div className="flex items-baseline font-serif font-bold tabular-nums leading-none">
                <span
                  className="text-[84px] text-parchment-solid"
                  style={{ textShadow: "0 3px 12px rgba(0, 0, 0, 0.5)" }}
                >
                  {displayPercent}
                </span>
                <span
                  className="text-[52px]"
                  style={{
                    color: "rgba(221, 176, 124, 0.85)",
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  %
                </span>
              </div>
              <motion.p
                className="font-serif italic text-[13px] tabular-nums"
                style={{
                  color: "rgba(245, 237, 220, 0.78)",
                  textShadow: "0 1px 4px rgba(0, 0, 0, 0.7)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                {score} of {TOTAL_ROUNDS}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* Flavor line */}
        <motion.p
          className="text-center font-serif italic text-[16px] -mt-1 px-2"
          style={{
            color: "rgba(245, 237, 220, 0.92)",
            textShadow: "0 1px 4px rgba(0,0,0,0.7)",
          }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.3 }}
        >
          {flavorLine}
        </motion.p>

        {/* Percentile bar */}
        <motion.div
          className="w-full flex flex-col gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.3 }}
        >
          <div className="flex items-baseline justify-between">
            <p
              className="text-[10px] tracking-[0.2em] uppercase"
              style={{
                color: "rgba(245, 237, 220, 0.72)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              Better than
            </p>
            <p
              className="font-serif font-bold tabular-nums text-[18px]"
              style={{
                color: "#F4CE8E",
                textShadow: "0 1px 5px rgba(0,0,0,0.7)",
              }}
            >
              {displayPercentile}
              <span className="text-[13px] font-normal"> % of players</span>
            </p>
          </div>
          <div
            className="relative w-full h-[5px] rounded-full overflow-hidden"
            style={{
              background: "rgba(20, 14, 8, 0.55)",
              boxShadow:
                "inset 0 1px 2px rgba(0,0,0,0.6), 0 1px 0 rgba(245,237,220,0.05)",
            }}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #B88F5A, #DDB07C, #F4CE8E)",
                boxShadow: "0 0 8px rgba(221, 176, 124, 0.6)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${percentile}%` }}
              transition={{
                delay: 0.3,
                duration: 0.9,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
          </div>
        </motion.div>

        {/* Stats row: streak + delta */}
        {(bestStreak > 1 || highScore > 0) && (
          <motion.div
            className="w-full flex items-center justify-center gap-5 text-[11px] tracking-wide"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.25, duration: 0.3 }}
          >
            {bestStreak > 1 && (
              <div className="flex items-center gap-1.5">
                <svg
                  width="12"
                  height="14"
                  viewBox="0 0 24 28"
                  fill="none"
                  style={{
                    filter: "drop-shadow(0 0 4px rgba(221,144,92,0.6))",
                  }}
                >
                  <path
                    d="M12 2 C14 6 18 9 18 14 C18 19 15 23 12 23 C9 23 6 19 6 14 C6 11 8 9 9 7 C10 9 11 10 12 10 C13 10 13 6 12 2 Z"
                    fill="url(#flame)"
                  />
                  <defs>
                    <linearGradient id="flame" x1="12" y1="2" x2="12" y2="23">
                      <stop offset="0" stopColor="#F4CE8E" />
                      <stop offset="0.6" stopColor="#DD905C" />
                      <stop offset="1" stopColor="#B85C5C" />
                    </linearGradient>
                  </defs>
                </svg>
                <span
                  className="font-serif tabular-nums"
                  style={{
                    color: "rgba(245, 237, 220, 0.95)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                  }}
                >
                  <span className="font-bold text-[14px]">{bestStreak}</span>
                  <span
                    className="text-[10px] tracking-[0.15em] uppercase ml-1.5"
                    style={{ color: "rgba(245, 237, 220, 0.7)" }}
                  >
                    streak
                  </span>
                </span>
              </div>
            )}

            {bestStreak > 1 && highScore > 0 && (
              <span
                className="h-3 w-px"
                style={{ background: "rgba(245, 237, 220, 0.15)" }}
              />
            )}

            {highScore > 0 && (
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] tracking-[0.15em] uppercase"
                  style={{
                    color: "rgba(245, 237, 220, 0.7)",
                    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                  }}
                >
                  {isNewHighScore ? "Prev best" : "Best"}
                </span>
                <span
                  className="font-serif font-bold tabular-nums text-[14px]"
                  style={{
                    color: "#F4CE8E",
                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  {highScore}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="w-full flex flex-col gap-3 mt-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.35, duration: 0.3 }}
        >
          <div className="flex flex-col items-center gap-1.5">
            <motion.button
              onClick={() => {
                haptic("heavy");
                onPlayAgain();
              }}
              className="relative w-full h-[52px] rounded-xl text-[14px] font-bold tracking-[0.18em] uppercase
                         cursor-pointer transition-transform duration-200"
              style={{
                background:
                  "linear-gradient(to right, #1C1108, #6B4D25 20%, #B8863A 45%, #C4935A 50%, #B8863A 55%, #6B4D25 80%, #1C1108)",
                border: "1.5px solid rgba(196, 147, 90, 0.5)",
                boxShadow:
                  "inset 0 1px 0 rgba(245, 237, 220, 0.15), inset 0 0 0 3px rgba(28, 17, 8, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)",
                color: "#F5EDDC",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="flex items-center justify-center gap-4">
                <span
                  className="flex-1 h-px max-w-8"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(245, 237, 220, 0.3))",
                  }}
                />
                <span>Play Again</span>
                <span
                  className="flex-1 h-px max-w-8"
                  style={{
                    background:
                      "linear-gradient(to left, transparent, rgba(245, 237, 220, 0.3))",
                  }}
                />
              </div>
            </motion.button>
            {getCTASubtitle() && (
              <p
                className="font-serif italic text-[11px] tracking-wide"
                style={{
                  color: "rgba(244, 206, 142, 0.9)",
                  textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                }}
              >
                {getCTASubtitle()}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={handleShare}
              className="h-11 rounded-xl text-[12px] font-semibold tracking-wide
                         cursor-pointer transition-transform duration-200"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30,22,14,0.85), rgba(44,36,24,0.9))",
                border: "1.5px solid rgba(196, 147, 90, 0.25)",
                boxShadow:
                  "inset 0 1px 0 rgba(245, 237, 220, 0.06), 0 2px 8px rgba(0,0,0,0.3)",
                color: "#F5EDDC",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {shareLabel}
            </motion.button>
            <motion.button
              onClick={() => {
                haptic("tap");
                onHome();
              }}
              className="h-11 rounded-xl text-[12px] font-semibold tracking-wide
                         cursor-pointer transition-transform duration-200"
              style={{
                background:
                  "linear-gradient(135deg, rgba(30,22,14,0.85), rgba(44,36,24,0.9))",
                border: "1.5px solid rgba(196, 147, 90, 0.15)",
                boxShadow:
                  "inset 0 1px 0 rgba(245, 237, 220, 0.04), 0 2px 8px rgba(0,0,0,0.3)",
                color: "rgba(245, 237, 220, 0.55)",
                textShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Home
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
