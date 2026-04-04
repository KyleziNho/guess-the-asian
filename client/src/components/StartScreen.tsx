import { motion } from "framer-motion";

interface StartScreenProps {
  onStart: () => void;
  onMultiplayer: () => void;
  highScore: number;
  isLoading: boolean;
}

export function StartScreen({ onStart, onMultiplayer, highScore, isLoading }: StartScreenProps) {
  return (
    <motion.div
      className="relative h-full w-full flex items-center justify-center overflow-hidden px-5 py-6 sm:px-8 sm:py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Floating "Hire Me" pill — top right */}
      <motion.a
        href="https://kyleosullivan.uk"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2.5 py-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-full backdrop-blur-md cursor-pointer"
        style={{
          background: "rgba(28, 17, 8, 0.65)",
          border: "1px solid rgba(221, 176, 124, 0.3)",
          boxShadow:
            "0 2px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 237, 220, 0.06)",
        }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        whileHover={{ scale: 1.05, y: -1 }}
        whileTap={{ scale: 0.96 }}
      >
        <img
          src="/kyleos-logo.png"
          alt="KyleOS"
          className="w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-[3px]"
          style={{
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))",
            flexShrink: 0,
          }}
        />
        <span
          className="hidden sm:inline text-[9px] tracking-[0.15em] uppercase font-semibold"
          style={{
            color: "rgba(245, 237, 220, 0.75)",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          Kyle's Work
        </span>
        <span
          className="text-[9px] sm:text-[9px] tracking-[0.15em] uppercase font-bold"
          style={{
            color: "#F4CE8E",
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          Hire Me
        </span>
      </motion.a>

      {/* Reading halo — soft dark vignette behind the text block */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at center, rgba(18,12,6,0.65) 0%, rgba(18,12,6,0.45) 40%, rgba(18,12,6,0.15) 70%, transparent 100%)",
        }}
      />

      <div className="relative w-full max-w-[600px] flex flex-col items-center gap-9 sm:gap-11">
        {/* Hero text group */}
        <motion.div
          className="w-full flex flex-col items-center gap-4 sm:gap-5"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.7 }}
        >
          {/* Ornamental divider + tagline */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className="h-px w-10 sm:w-14"
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
                className="h-px w-10 sm:w-14"
                style={{
                  background:
                    "linear-gradient(to left, transparent, rgba(221,176,124,0.6))",
                }}
              />
            </div>
            <p
              className="text-center text-[11px] sm:text-xs tracking-[0.3em] uppercase font-semibold"
              style={{
                color: "rgba(245, 237, 220, 0.95)",
                textShadow:
                  "0 1px 3px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.7)",
              }}
            >
              A game of faces & places
            </p>
          </div>

          {/* Title — staggered cascade */}
          <div className="flex justify-center">
            <h1
              className="text-left"
              style={{
                textShadow:
                  "0 2px 4px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              <span className="block text-[64px] sm:text-[88px] md:text-[104px] font-serif font-bold text-parchment-solid leading-[0.85] tracking-tight">
                Guess
              </span>
              <span className="block text-[44px] sm:text-[60px] md:text-[72px] font-serif italic font-normal text-gold leading-[0.95] ml-8 sm:ml-14 md:ml-16">
                the
              </span>
              <span className="block text-[64px] sm:text-[88px] md:text-[104px] font-serif font-bold text-parchment-solid leading-[0.85] tracking-tight ml-3 sm:ml-5 md:ml-6">
                Asian
              </span>
            </h1>
          </div>

        </motion.div>

        {/* Button & personal best */}
        <motion.div
          className="w-full flex flex-col items-center gap-4"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <motion.button
            onClick={onStart}
            disabled={isLoading}
            className="relative w-full max-w-[340px] block h-[52px] rounded-[10px]
                       text-[15px] font-bold tracking-[0.2em] uppercase
                       cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200"
            style={{
              background:
                "linear-gradient(to right, #1C1108, #6B4D25 20%, #B8863A 45%, #C4935A 50%, #B8863A 55%, #6B4D25 80%, #1C1108)",
              border: "1.5px solid rgba(221, 176, 124, 0.5)",
              boxShadow:
                "inset 0 1px 0 rgba(245, 237, 220, 0.15), inset 0 0 0 3px rgba(28, 17, 8, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)",
              color: "#F5EDDC",
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <motion.span
                  className="w-4 h-4 border-2 border-parchment-solid/30 border-t-parchment-solid rounded-full inline-block"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Loading
              </span>
            ) : (
              <div className="flex items-center justify-center gap-4">
                <span
                  className="flex-1 h-px max-w-8"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(245, 237, 220, 0.3))",
                  }}
                />
                <span>Begin</span>
                <span
                  className="flex-1 h-px max-w-8"
                  style={{
                    background:
                      "linear-gradient(to left, transparent, rgba(245, 237, 220, 0.3))",
                  }}
                />
              </div>
            )}
          </motion.button>

          <motion.button
            onClick={onMultiplayer}
            disabled={isLoading}
            className="relative w-full max-w-[340px] block h-[46px] rounded-[10px]
                       text-[12px] font-bold tracking-[0.2em] uppercase
                       cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-200"
            style={{
              background:
                "linear-gradient(135deg, rgba(30,22,14,0.88), rgba(44,36,24,0.92))",
              border: "1.5px solid rgba(221, 176, 124, 0.35)",
              boxShadow:
                "inset 0 1px 0 rgba(245, 237, 220, 0.08), 0 4px 14px rgba(0, 0, 0, 0.4)",
              color: "rgba(245, 237, 220, 0.88)",
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="flex items-center justify-center gap-2.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Duel a Friend</span>
            </span>
          </motion.button>

          {highScore > 0 && (
            <motion.div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md"
              style={{
                background: "rgba(28, 17, 8, 0.72)",
                border: "1px solid rgba(221, 176, 124, 0.35)",
                boxShadow:
                  "0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(245, 237, 220, 0.08)",
              }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="#F4CE8E"
                style={{
                  filter: "drop-shadow(0 0 4px rgba(244,206,142,0.5))",
                  flexShrink: 0,
                }}
              >
                <path d="M12 2 L14.2 9.2 L21.6 9.2 L15.7 13.6 L17.9 20.8 L12 16.4 L6.1 20.8 L8.3 13.6 L2.4 9.2 L9.8 9.2 Z" />
              </svg>
              <span
                className="text-[11px] tracking-[0.15em] uppercase font-semibold"
                style={{
                  color: "rgba(245, 237, 220, 0.85)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                }}
              >
                Personal Best
              </span>
              <span
                className="text-[11px]"
                style={{ color: "rgba(221, 176, 124, 0.5)" }}
              >
                ·
              </span>
              <span
                className="font-serif font-bold tabular-nums text-[14px]"
                style={{
                  color: "#F4CE8E",
                  textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                }}
              >
                {highScore}
                <span
                  className="text-[11px] font-normal"
                  style={{ color: "rgba(244, 206, 142, 0.65)" }}
                >
                  /10
                </span>
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
