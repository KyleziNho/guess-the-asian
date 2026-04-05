import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FloatingReaction, RoomState } from "../../lib/multiplayerTypes";
import { COUNTRY_MAP } from "../../lib/constants";
import { PhotoCard } from "../PhotoCard";
import { PlayerCard } from "./PlayerCard";
import { ReactionBar } from "./ReactionBar";
import { FloatingReactions } from "./FloatingReactions";
import { DisconnectBanner } from "./DisconnectBanner";
import { haptic } from "../../lib/haptics";

interface MultiplayerGameScreenProps {
  room: RoomState;
  playerId: string;
  onPick: (country: string) => void;
  onReaction: (emoji: string) => void;
  onForfeitOpponent: () => void;
  onLeave: () => void;
  reactions: FloatingReaction[];
}

export function MultiplayerGameScreen({
  room,
  playerId,
  onPick,
  onReaction,
  onForfeitOpponent,
  onLeave,
  reactions,
}: MultiplayerGameScreenProps) {
  const self = room.players.find((p) => p.id === playerId);
  const opponent = room.players.find((p) => p.id !== playerId);
  const person = room.person;
  const options = room.options;
  const isReveal = room.phase === "reveal";

  // Round-advance tick — each new round fires a progress-bar style scroll
  // pulse so the thin top bar "ratchets" forward with a bump.
  const prevRoundRef = useRef(room.currentRound);
  useEffect(() => {
    if (room.currentRound !== prevRoundRef.current) {
      prevRoundRef.current = room.currentRound;
      haptic("tick");
    }
  }, [room.currentRound]);

  // Soft buzz when the opponent sends a reaction. We diff against the last
  // set of seen reaction ids so our own outgoing reactions don't re-buzz.
  const seenReactionIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    let newIncoming = false;
    for (const r of reactions) {
      if (seenReactionIdsRef.current.has(r.id)) continue;
      seenReactionIdsRef.current.add(r.id);
      if (r.playerId !== playerId) newIncoming = true;
    }
    if (newIncoming) haptic("reaction");
  }, [reactions, playerId]);

  // Track opponent pick arrival while you're still thinking — a small "locked
  // in" nudge that they've answered.
  const oppPickedRef = useRef(false);
  useEffect(() => {
    if (!opponent || isReveal) {
      oppPickedRef.current = false;
      return;
    }
    const picked = room.picks?.[opponent.id] != null;
    if (picked && !oppPickedRef.current) {
      oppPickedRef.current = true;
      haptic("tick");
    } else if (!picked) {
      oppPickedRef.current = false;
    }
  }, [room.picks, opponent, isReveal]);

  // Opponent disconnection = sharp heavy buzz.
  const oppConnectedRef = useRef<boolean>(opponent?.connected ?? true);
  useEffect(() => {
    if (!opponent) return;
    if (oppConnectedRef.current && !opponent.connected) {
      haptic("disconnect");
    } else if (!oppConnectedRef.current && opponent.connected) {
      haptic("join");
    }
    oppConnectedRef.current = opponent.connected;
  }, [opponent]);

  // Reveal pulse — fires once per reveal transition, keyed on round so a
  // lingering reveal phase doesn't re-buzz.
  const lastRevealRoundRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isReveal || !person) return;
    if (lastRevealRoundRef.current === room.currentRound) return;
    lastRevealRoundRef.current = room.currentRound;
    const selfPickRaw = room.picks?.[playerId] ?? null;
    const oppPickRaw = opponent ? room.picks?.[opponent.id] ?? null : null;
    const sCorr = selfPickRaw === person.country;
    const oCorr = oppPickRaw === person.country;
    // Prioritize the feel of YOUR result first, then layer a subtle extra
    // pulse if the outcome was a meaningful split decision.
    if (sCorr) {
      haptic("success");
      // Outplayed the rival — extra triumphant bump.
      if (opponent && !oCorr) {
        const t = setTimeout(() => haptic("streak"), 200);
        return () => clearTimeout(t);
      }
    } else {
      haptic("error");
    }
  }, [isReveal, room.currentRound, person, opponent, playerId, room.picks]);

  if (!person || !self) return null;

  const correctCountry = isReveal ? person.country : null;
  const picks = room.picks ?? {};
  const selfPick = picks[self.id] ?? null;
  const opponentPick = opponent ? picks[opponent.id] ?? null : null;

  const selfPickResult: "correct" | "wrong" | null = isReveal
    ? selfPick
      ? selfPick === person.country
        ? "correct"
        : "wrong"
      : "wrong"
    : null;
  const oppPickResult: "correct" | "wrong" | null = isReveal
    ? opponentPick
      ? opponentPick === person.country
        ? "correct"
        : "wrong"
      : "wrong"
    : null;

  const borderGlow = isReveal
    ? selfPickResult === "correct"
      ? "ring-2 ring-correct/60 shadow-[0_0_24px_rgba(94,140,97,0.3)]"
      : "ring-2 ring-wrong/60 shadow-[0_0_24px_rgba(184,92,92,0.3)]"
    : "ring-1 ring-gold-dim/20";

  // Outcome banner copy
  const outcomeText = (() => {
    if (!isReveal) return null;
    const sCorr = selfPickResult === "correct";
    const oCorr = oppPickResult === "correct";
    if (sCorr && oCorr) return { text: "Both nailed it", tone: "both-correct" };
    if (!sCorr && !oCorr) return { text: "Both wrong", tone: "both-wrong" };
    if (sCorr) return { text: "You got it — they didn't", tone: "you-win" };
    return { text: `${opponent?.name ?? "Opponent"} got it — you didn't`, tone: "opp-win" };
  })();

  return (
    <motion.div
      className="relative h-full w-full flex items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <FloatingReactions reactions={reactions} selfId={playerId} />

      <div className="relative w-full max-w-[480px] flex flex-col gap-3 sm:gap-3.5 z-10">
        {/* Header: progress bar + exit */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-1">
            {Array.from({ length: room.totalRounds }).map((_, i) => {
              const isPast = i < room.currentRound;
              const isCurrent = i === room.currentRound;
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
          <span
            className="text-[9px] tracking-[0.25em] uppercase font-semibold tabular-nums"
            style={{
              color: "rgba(245,237,220,0.55)",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {room.currentRound + 1}/{room.totalRounds}
          </span>
          <motion.button
            onClick={() => {
              haptic("tap");
              onLeave();
            }}
            aria-label="Leave match"
            className="flex items-center justify-center w-6 h-6 rounded-full cursor-pointer transition-colors duration-200"
            style={{ color: "rgba(245, 237, 220, 0.45)" }}
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

        {/* Dual player scoreboard */}
        <div className="flex items-stretch gap-2.5">
          <PlayerCard
            player={self}
            isSelf
            isHost={room.hostId === self.id}
            compact
            align="left"
            showPickState={!isReveal}
            pickResult={selfPickResult}
            pickedCountry={isReveal ? selfPick : null}
          />
          <div className="flex items-center justify-center">
            <span
              className="font-serif italic text-[10px] tracking-[0.3em] uppercase"
              style={{
                color: "rgba(245,237,220,0.4)",
                textShadow: "0 1px 3px rgba(0,0,0,0.7)",
              }}
            >
              vs
            </span>
          </div>
          <PlayerCard
            player={opponent ?? null}
            isSelf={false}
            isHost={opponent ? room.hostId === opponent.id : false}
            compact
            align="right"
            showPickState={!isReveal}
            pickResult={oppPickResult}
            pickedCountry={isReveal ? opponentPick : null}
          />
        </div>

        {/* Disconnect / solo-mode banner */}
        <DisconnectBanner
          opponent={opponent ?? null}
          graceMs={room.graceMs}
          onForfeit={onForfeitOpponent}
          soloMode={room.mode === "solo"}
        />

        {/* Photo with floating prompt/result */}
        <div
          className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 ${borderGlow}`}
          style={{
            height: "clamp(300px, 52vh, 580px)",
            boxShadow: isReveal
              ? undefined
              : "0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          <PhotoCard person={person} roundKey={room.currentRound} />

          {/* Floating prompt/outcome pill */}
          <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none z-10 px-4">
            <AnimatePresence mode="wait">
              {!isReveal ? (
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
                    background: "rgba(28, 17, 8, 0.82)",
                    border: `1px solid ${
                      outcomeText?.tone === "both-correct"
                        ? "rgba(94, 140, 97, 0.7)"
                        : outcomeText?.tone === "both-wrong"
                          ? "rgba(184, 92, 92, 0.7)"
                          : "rgba(221, 176, 124, 0.6)"
                    }`,
                    boxShadow:
                      outcomeText?.tone === "both-correct"
                        ? "0 4px 16px rgba(0,0,0,0.4), 0 0 16px rgba(94,140,97,0.3)"
                        : outcomeText?.tone === "both-wrong"
                          ? "0 4px 16px rgba(0,0,0,0.4), 0 0 16px rgba(184,92,92,0.3)"
                          : "0 4px 16px rgba(0,0,0,0.4), 0 0 16px rgba(221,176,124,0.25)",
                  }}
                >
                  <p
                    className="font-serif italic text-[12px] sm:text-[13px] whitespace-nowrap"
                    style={{
                      color: "rgba(245, 237, 220, 0.96)",
                      textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
                    }}
                  >
                    {outcomeText?.text} ·{" "}
                    <span style={{ color: "#F4CE8E" }}>{correctCountry}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reaction bar (bottom overlay) */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center px-3 z-10">
            <ReactionBar onSend={onReaction} />
          </div>
        </div>

        {/* Country buttons */}
        <MultiplayerCountryButtons
          options={options}
          correctCountry={correctCountry}
          selfPick={selfPick}
          opponentPick={isReveal ? opponentPick : null}
          selfColor={self.color}
          opponentColor={opponent?.color ?? null}
          locked={selfPick !== null || isReveal}
          onGuess={onPick}
        />
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

import { getColorTheme } from "../../lib/multiplayerConstants";

interface MpButtonsProps {
  options: string[];
  correctCountry: string | null;
  selfPick: string | null;
  opponentPick: string | null;
  selfColor: string;
  opponentColor: string | null;
  locked: boolean;
  onGuess: (country: string) => void;
}

function MultiplayerCountryButtons({
  options,
  correctCountry,
  selfPick,
  opponentPick,
  selfColor,
  opponentColor,
  locked,
  onGuess,
}: MpButtonsProps) {
  const showResult = correctCountry !== null;
  const selfTheme = getColorTheme(selfColor);
  const oppTheme = opponentColor ? getColorTheme(opponentColor) : null;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((name) => {
        const flag = COUNTRY_MAP[name] ?? "";
        const isCorrect = showResult && name === correctCountry;
        const isSelfChoice = name === selfPick;
        const isOppChoice = name === opponentPick;
        const isWrongChoice =
          showResult && (isSelfChoice || isOppChoice) && name !== correctCountry;
        const dim = showResult && !isCorrect && !isSelfChoice && !isOppChoice;

        let borderColor = "rgba(221, 176, 124, 0.35)";
        let background =
          "linear-gradient(135deg, rgba(30,22,14,0.85), rgba(44,36,24,0.9))";
        let shadow =
          "inset 0 1px 0 rgba(245, 237, 220, 0.06), 0 2px 8px rgba(0,0,0,0.3)";

        if (!showResult && isSelfChoice) {
          // Player picked, awaiting opponent
          borderColor = selfTheme.base;
          background = `linear-gradient(135deg, ${selfTheme.base}28, ${selfTheme.dim}18)`;
          shadow = `0 0 18px ${selfTheme.glow}, inset 0 1px 0 rgba(245,237,220,0.1)`;
        } else if (showResult) {
          if (isCorrect) {
            borderColor = "#5E8C61";
            background =
              "linear-gradient(135deg, rgba(94,140,97,0.28), rgba(94,140,97,0.15))";
            shadow =
              "0 0 22px rgba(94,140,97,0.4), inset 0 1px 0 rgba(94,140,97,0.2)";
          } else if (isWrongChoice) {
            borderColor = "#B85C5C";
            background =
              "linear-gradient(135deg, rgba(184,92,92,0.28), rgba(184,92,92,0.15))";
            shadow =
              "0 0 22px rgba(184,92,92,0.4), inset 0 1px 0 rgba(184,92,92,0.2)";
          }
        }

        const interactive = !locked && !showResult;

        return (
          <motion.button
            key={name}
            onClick={() => {
              haptic("select");
              onGuess(name);
            }}
            disabled={locked}
            className="relative flex flex-col items-center justify-center gap-1 h-[58px] rounded-xl cursor-pointer disabled:cursor-not-allowed"
            style={{
              background,
              border: `1.5px solid ${borderColor}`,
              boxShadow: shadow,
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
              transition:
                "border-color 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease",
              opacity: dim ? 0.32 : 1,
            }}
            whileHover={interactive ? { scale: 1.03 } : undefined}
            whileTap={interactive ? { scale: 0.96 } : undefined}
          >
            <span className="text-2xl leading-none">{flag}</span>
            <span className="text-[12px] font-semibold tracking-wide text-parchment-solid leading-none">
              {name}
            </span>

            {/* Player picker chips */}
            {(isSelfChoice || (showResult && isOppChoice)) && (
              <div className="absolute -top-1.5 flex gap-1">
                {isSelfChoice && (
                  <motion.div
                    layoutId="self-chip"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-1.5 h-4 rounded-full flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      background: selfTheme.base,
                      color: "#1C1108",
                      boxShadow: `0 0 10px ${selfTheme.glow}`,
                    }}
                  >
                    You
                  </motion.div>
                )}
                {showResult && isOppChoice && oppTheme && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-1.5 h-4 rounded-full flex items-center text-[8px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      background: oppTheme.base,
                      color: "#1C1108",
                      boxShadow: `0 0 10px ${oppTheme.glow}`,
                    }}
                  >
                    Rival
                  </motion.div>
                )}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
