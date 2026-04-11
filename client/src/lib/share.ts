import type { RoomState } from "./multiplayerTypes";
import type { RoundResult } from "./types";
import { TOTAL_ROUNDS } from "./constants";

const SITE_URL = "https://asianguesser.com";

export interface ShareData {
  text: string;
  url: string;
}

/** Only offer native share on mobile (desktop users expect clipboard). */
function canNativeShare(): boolean {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

/**
 * Try native share on mobile, fall back to clipboard.
 * Returns `"shared"` or `"copied"` so the caller can update the button label.
 */
export async function shareResult(data: ShareData): Promise<"shared" | "copied"> {
  if (canNativeShare()) {
    try {
      await navigator.share({ text: data.text, url: data.url });
      return "shared";
    } catch {
      // User cancelled or API failed — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(`${data.text}\n${data.url}`);
  return "copied";
}

// ── Duel share ──────────────────────────────────────────────────────────────

function duelFlavorText(margin: number): string {
  if (margin >= 5) return "Absolute domination";
  if (margin >= 4) return "Clean sweep";
  if (margin >= 2) return "Solid dub";
  if (margin === 1) return "Scraped by";
  if (margin === 0) return "Dead heat";
  if (margin === -1) return "So close";
  if (margin >= -3) return "Down bad";
  return "Got cooked";
}

export function formatDuelShare(room: RoomState, selfId: string): ShareData {
  const self = room.players.find((p) => p.id === selfId);
  const opp = room.players.find((p) => p.id !== selfId);
  if (!self) return { text: "", url: SITE_URL };

  const selfScore = self.score;
  const oppScore = opp?.score ?? 0;
  const margin = selfScore - oppScore;

  const selfBlocks = room.history
    .map((r) => (r.correct[selfId] ? "1" : "0"))
    .join("");
  const oppBlocks = opp
    ? room.history.map((r) => (r.correct[opp.id] ? "1" : "0")).join("")
    : "";

  const textBlocks = selfBlocks
    .split("")
    .map((b) => (b === "1" ? "\u25A0" : "\u25A1"))
    .join("");
  const bestStreak = Math.max(self.bestStreak, opp?.bestStreak ?? 0);
  const flavor = duelFlavorText(margin);
  const streakLine = bestStreak > 1 ? ` \u00B7 \uD83D\uDD25${bestStreak} streak` : "";

  const text = [
    "Guess The Asian \u2694\uFE0F DUEL",
    "",
    `${self.avatar} ${self.name} ${selfScore} \u2014 ${oppScore} ${opp?.name ?? "???"} ${opp?.avatar ?? "\uD83D\uDC64"}`,
    textBlocks,
    "",
    `${flavor}${streakLine}`,
  ].join("\n");

  const params = new URLSearchParams();
  params.set("m", "d");
  params.set("a", self.name);
  params.set("b", String(selfScore));
  params.set("c", self.avatar);
  params.set("x", opp?.name ?? "Rival");
  params.set("y", String(oppScore));
  params.set("z", opp?.avatar ?? "\uD83D\uDC64");
  params.set("n", String(room.totalRounds));
  params.set("h", selfBlocks);
  if (oppBlocks) params.set("g", oppBlocks);

  return {
    text,
    url: `${SITE_URL}/api/share?${params.toString()}`,
  };
}

// ── Solo share ──────────────────────────────────────────────────────────────

export function formatSoloShare(
  score: number,
  results: RoundResult[],
  bestStreak: number,
  rankTitle: string,
): ShareData {
  const pct = Math.round((score / TOTAL_ROUNDS) * 100);
  const blocksBinary = results.map((r) => (r.correct ? "1" : "0")).join("");
  const textBlocks = results
    .map((r) => (r.correct ? "\u25A0" : "\u25A1"))
    .join(" ");
  const streakLine = bestStreak > 1 ? ` \u00B7 \uD83D\uDD25${bestStreak} streak` : "";

  const text = [
    `Guess The Asian \uD83C\uDF0F \u00B7 ${rankTitle}`,
    `${pct}% \u2014 ${score} of ${TOTAL_ROUNDS}${streakLine}`,
    textBlocks,
  ].join("\n");

  const params = new URLSearchParams();
  params.set("m", "s");
  params.set("s", String(score));
  params.set("b", blocksBinary);
  if (bestStreak > 1) params.set("k", String(bestStreak));

  return {
    text,
    url: `${SITE_URL}/api/share?${params.toString()}`,
  };
}
