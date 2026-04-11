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

export function formatDuelShare(room: RoomState, selfId: string): ShareData {
  const self = room.players.find((p) => p.id === selfId);
  const opp = room.players.find((p) => p.id !== selfId);
  if (!self) return { text: "", url: SITE_URL };

  const selfScore = self.score;
  const oppScore = opp?.score ?? 0;

  const selfBlocks = room.history
    .map((r) => (r.correct[selfId] ? "1" : "0"))
    .join("");
  const oppBlocks = opp
    ? room.history.map((r) => (r.correct[opp.id] ? "1" : "0")).join("")
    : "";

  // Minimal teaser — the OG card does the heavy lifting visually.
  const text =
    selfScore > oppScore
      ? `I beat ${opp?.name ?? "a friend"} ${selfScore}\u2013${oppScore} on Guess The Asian \u2694\uFE0F`
      : selfScore < oppScore
        ? `${opp?.name ?? "A friend"} beat me ${oppScore}\u2013${selfScore} on Guess The Asian \u2014 can you avenge me?`
        : `Tied ${selfScore}\u2013${oppScore} on Guess The Asian \u2694\uFE0F Who's the real champ?`;

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
  _rankTitle: string,
): ShareData {
  const pct = Math.round((score / TOTAL_ROUNDS) * 100);
  const blocksBinary = results.map((r) => (r.correct ? "1" : "0")).join("");

  // Short teaser — the preview card shows the rank, blocks, flavor, etc.
  const text =
    pct >= 80
      ? `I scored ${pct}% on Guess The Asian \uD83C\uDF0F \u2014 beat me?`
      : pct >= 50
        ? `${pct}% on Guess The Asian \uD83C\uDF0F \u2014 think you can do better?`
        : `I got humbled by Guess The Asian \uD83C\uDF0F (${pct}%). Your turn.`;

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
