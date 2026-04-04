import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useGame } from "./hooks/useGame";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useMultiplayer } from "./hooks/useMultiplayer";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { StartScreen } from "./components/StartScreen";
import { GameScreen } from "./components/GameScreen";
import { GameOverScreen } from "./components/GameOverScreen";
import { MultiplayerLobby } from "./components/multiplayer/MultiplayerLobby";
import { MultiplayerRoom } from "./components/multiplayer/MultiplayerRoom";
import { MultiplayerGameScreen } from "./components/multiplayer/MultiplayerGameScreen";
import { MultiplayerGameOverScreen } from "./components/multiplayer/MultiplayerGameOverScreen";
import { ConnectionOverlay } from "./components/multiplayer/ConnectionOverlay";
import type { PlayerProfile } from "./lib/multiplayerTypes";

type TopPhase = "solo" | "mp";

const DEFAULT_PROFILE: PlayerProfile = {
  name: "",
  avatar: "🦊",
  color: "gold",
};

function App() {
  const { state, startGame, guess, nextRound, reset } = useGame();
  const [highScore, setHighScore] = useLocalStorage("gta-high-score", 0);
  const [savedProfile, setSavedProfile] = useLocalStorage<PlayerProfile>(
    "gta-mp-profile",
    DEFAULT_PROFILE
  );
  const [profile, setProfile] = useState<PlayerProfile>(savedProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [topPhase, setTopPhase] = useState<TopPhase>("solo");

  const mp = useMultiplayer();

  // Persist profile edits
  useEffect(() => {
    setSavedProfile(profile);
  }, [profile, setSavedProfile]);

  // While in a room lobby, push profile updates to the server — debounced so
  // we don't broadcast on every keystroke. Server also freezes updates once
  // the match starts, so we bail early once phase leaves "lobby".
  useEffect(() => {
    if (topPhase !== "mp" || !mp.room || !mp.playerId) return;
    if (mp.room.phase !== "lobby") return;
    const timer = setTimeout(() => {
      mp.updateProfile(profile);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.name, profile.avatar, profile.color, mp.room?.phase]);

  // If a prior session auto-resumes on page load, hop straight into mp view.
  useEffect(() => {
    if (mp.room && topPhase !== "mp") {
      setTopPhase("mp");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mp.room?.code]);

  // ── Solo handlers ───────────────────────────────────────────────────────────
  const handleSoloStart = useCallback(async () => {
    setIsLoading(true);
    try {
      await startGame();
    } catch {
      alert("Failed to load game data. Is the server running?");
    } finally {
      setIsLoading(false);
    }
  }, [startGame]);

  const handleSoloPlayAgain = useCallback(async () => {
    if (state.score > highScore) setHighScore(state.score);
    await handleSoloStart();
  }, [state.score, highScore, setHighScore, handleSoloStart]);

  const handleSoloHome = useCallback(() => {
    if (state.score > highScore) setHighScore(state.score);
    reset();
  }, [state.score, highScore, setHighScore, reset]);

  // ── Multiplayer handlers ────────────────────────────────────────────────────
  const handleOpenMp = useCallback(() => {
    setTopPhase("mp");
  }, []);

  const handleMpBack = useCallback(() => {
    if (mp.room) mp.leaveRoom();
    mp.reset();
    setTopPhase("solo");
  }, [mp]);

  const handleMpLeaveRoom = useCallback(() => {
    mp.leaveRoom();
  }, [mp]);

  const handleMpCreate = useCallback(() => {
    if (!profile.name.trim()) return;
    mp.createRoom({ ...profile, name: profile.name.trim() || "Player" });
  }, [mp, profile]);

  const handleMpJoin = useCallback(
    (code: string) => {
      if (!profile.name.trim()) return;
      mp.joinRoom(code, { ...profile, name: profile.name.trim() || "Player" });
    },
    [mp, profile]
  );

  // Determine which multiplayer screen to show
  const isInMp = topPhase === "mp";
  const mpPhase = mp.room?.phase;

  // Blur background for any in-game screen
  const isInGame =
    (topPhase === "solo" && state.phase !== "start") ||
    (isInMp &&
      (mpPhase === "playing" || mpPhase === "reveal" || mpPhase === "gameover"));

  return (
    <div className="h-full">
      <AnimatedBackground
        blur={isInGame ? 10 : 0}
        darken={isInGame ? 0.55 : 0.2}
      />

      <div className="relative z-10 h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ── Solo mode ─────────────────────────────────────────── */}
          {topPhase === "solo" && state.phase === "start" && (
            <StartScreen
              key="start"
              onStart={handleSoloStart}
              onMultiplayer={handleOpenMp}
              highScore={highScore}
              isLoading={isLoading}
            />
          )}

          {topPhase === "solo" &&
            (state.phase === "playing" || state.phase === "result") && (
              <GameScreen
                key="game"
                state={state}
                onGuess={guess}
                onNextRound={nextRound}
                onExit={handleSoloHome}
              />
            )}

          {topPhase === "solo" && state.phase === "gameover" && (
            <GameOverScreen
              key="gameover"
              score={state.score}
              bestStreak={state.bestStreak}
              results={state.results}
              highScore={highScore}
              onPlayAgain={handleSoloPlayAgain}
              onHome={handleSoloHome}
            />
          )}

          {/* ── Multiplayer mode ──────────────────────────────────── */}
          {isInMp && !mp.room && (
            <MultiplayerLobby
              key="mp-lobby"
              profile={profile}
              onProfileChange={setProfile}
              onCreate={handleMpCreate}
              onJoin={handleMpJoin}
              onBack={handleMpBack}
              error={mp.error}
              onClearError={mp.clearError}
              status={mp.status}
            />
          )}

          {isInMp && mp.room && mpPhase === "lobby" && mp.playerId && (
            <MultiplayerRoom
              key="mp-room"
              room={mp.room}
              playerId={mp.playerId}
              profile={profile}
              onProfileChange={setProfile}
              onToggleReady={mp.toggleReady}
              onUpdateSettings={mp.updateSettings}
              onStart={mp.startGame}
              onLeave={handleMpLeaveRoom}
              error={mp.error}
              onClearError={mp.clearError}
            />
          )}

          {isInMp &&
            mp.room &&
            (mpPhase === "playing" || mpPhase === "reveal") &&
            mp.playerId && (
              <MultiplayerGameScreen
                key="mp-game"
                room={mp.room}
                playerId={mp.playerId}
                onPick={mp.pick}
                onReaction={mp.sendReaction}
                onForfeitOpponent={mp.forfeitOpponent}
                onLeave={handleMpLeaveRoom}
                reactions={mp.reactions}
              />
            )}

          {isInMp && mp.room && mpPhase === "gameover" && mp.playerId && (
            <MultiplayerGameOverScreen
              key="mp-gameover"
              room={mp.room}
              playerId={mp.playerId}
              onRematch={mp.rematch}
              onLeave={handleMpLeaveRoom}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Global reconnection badge — only appears in multiplayer mode */}
      {isInMp && <ConnectionOverlay status={mp.status} />}
    </div>
  );
}

export default App;
