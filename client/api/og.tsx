import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

// Warm parchment palette matching the app
const C = {
  bgDark: "#1C1108",
  bgMid: "#2C2418",
  gold: "#DDB07C",
  goldBright: "#F4CE8E",
  bronze: "#B88F5A",
  parchment: "#F5EDDC",
  parchmentDim: "rgba(245, 237, 220, 0.72)",
  parchmentFaint: "rgba(245, 237, 220, 0.45)",
  border: "rgba(221, 176, 124, 0.4)",
  borderSoft: "rgba(221, 176, 124, 0.2)",
};

// Rank table — matches GameOverScreen getRank()
function getRank(score: number) {
  if (score === 10) return { title: "GOOGLE MAPS STREET VIEW CAR", subtitle: "You've seen every road" };
  if (score >= 8) return { title: "MR. WORLDWIDE", subtitle: "Pitbull would be proud" };
  if (score === 7) return { title: "GEO-GUESSER SWEAT", subtitle: "Recognizes dirt patterns" };
  if (score === 6) return { title: "CULTURE VULTURE", subtitle: "Owns one pair of harem pants" };
  if (score >= 4) return { title: "FREQUENT FLYER", subtitle: "Knows their way around an airport" };
  if (score >= 2) return { title: "ECONOMY CLASS", subtitle: "Just happy to be here" };
  if (score === 1) return { title: "LOST TOURIST", subtitle: "Looking for the nearest McDonald's" };
  return { title: "BASEMENT DWELLER", subtitle: "Has never seen the sun" };
}

// Short flavor line indexed by score
function getFlavor(score: number): string {
  if (score === 10) return "Literally the blueprint.";
  if (score === 9) return "Built different. Actually goated.";
  if (score === 8) return "Big brain energy fr.";
  if (score === 7) return "Main character moment.";
  if (score === 6) return "Unironically popping off.";
  if (score === 5) return "Passing the vibe check.";
  if (score === 4) return "Aggressively mid. Not terrible.";
  if (score === 3) return "Major skill issue tbh.";
  if (score === 2) return "Down horrendous.";
  if (score === 1) return "Bro is playing with the monitor off.";
  return "Just put the fries in the bag bro.";
}

function duelFlavor(margin: number): string {
  if (margin >= 5) return "Absolute domination";
  if (margin >= 4) return "Clean sweep";
  if (margin >= 2) return "Solid dub";
  if (margin === 1) return "Scraped by";
  if (margin === 0) return "Dead heat — nobody won";
  if (margin === -1) return "So close…";
  if (margin >= -3) return "Down bad";
  return "Got cooked";
}

async function loadGoogleFont(family: string, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`Failed to parse font CSS for ${family}`);
  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`Failed to fetch font for ${family}`);
  return await fontRes.arrayBuffer();
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function parseBlocks(raw: string | null, length: number): string {
  const s = (raw ?? "").replace(/[^01]/g, "");
  return s.padEnd(length, "0").slice(0, length);
}

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("m") ?? "s";

    if (mode === "d") {
      return await duelImage(searchParams);
    }
    return await soloImage(searchParams);
  } catch (err) {
    return new Response(`OG image error: ${(err as Error).message}`, { status: 500 });
  }
}

// ── Solo image ───────────────────────────────────────────────────────────────

async function soloImage(params: URLSearchParams) {
  const score = clamp(parseInt(params.get("s") ?? "0", 10) || 0, 0, 10);
  const blocks = parseBlocks(params.get("b"), 10);
  const streak = clamp(parseInt(params.get("k") ?? "0", 10) || 0, 0, 10);
  const pct = Math.round((score / 10) * 100);
  const rank = getRank(score);
  const flavor = getFlavor(score);

  const textSample =
    "GUESS THE ASIAN asianguesser.com RANK STREAK " +
    "0123456789% of 10 " +
    rank.title +
    rank.subtitle +
    flavor +
    "Think you can beat me?";

  const [playfairBold, playfairItalic, dmBold] = await Promise.all([
    loadGoogleFont("Playfair+Display:wght@700", textSample),
    loadGoogleFont("Playfair+Display:ital@1&display=swap", textSample),
    loadGoogleFont("DM+Sans:wght@700", textSample),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: `radial-gradient(ellipse at 50% 0%, ${C.bgMid} 0%, ${C.bgDark} 80%)`,
          padding: "48px 60px",
          fontFamily: "'DM Sans'",
          color: C.parchment,
          position: "relative",
        }}
      >
        {/* Ornamental border */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: `2px solid ${C.border}`,
            borderRadius: 18,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: `1px solid ${C.borderSoft}`,
            borderRadius: 12,
            display: "flex",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 28,
              letterSpacing: "0.28em",
              color: C.gold,
              fontWeight: 700,
            }}
          >
            🌏 GUESS THE ASIAN
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontStyle: "italic",
              color: C.parchmentFaint,
              fontFamily: "'Playfair Display'",
            }}
          >
            asianguesser.com
          </div>
        </div>

        {/* Main content row */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            marginTop: 6,
            zIndex: 1,
          }}
        >
          {/* Left: huge percentage */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: 440,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontFamily: "'Playfair Display'",
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  fontSize: 220,
                  color: C.goldBright,
                  lineHeight: 0.9,
                  textShadow: `0 0 40px ${C.gold}`,
                }}
              >
                {pct}
              </div>
              <div style={{ fontSize: 110, color: C.gold, lineHeight: 0.9 }}>
                %
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                color: C.parchmentDim,
                fontStyle: "italic",
                fontFamily: "'Playfair Display'",
                marginTop: 6,
              }}
            >
              {score} of 10
            </div>
            {streak >= 2 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: 14,
                  padding: "6px 16px",
                  background: "rgba(221, 144, 92, 0.18)",
                  border: "1.5px solid rgba(221, 144, 92, 0.55)",
                  borderRadius: 999,
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#F4CE8E",
                  letterSpacing: "0.1em",
                }}
              >
                🔥 {streak} STREAK
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              display: "flex",
              width: 1,
              height: 320,
              background: C.border,
            }}
          />

          {/* Right: rank + blocks */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              paddingLeft: 48,
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 16,
                letterSpacing: "0.35em",
                color: C.parchmentFaint,
                fontWeight: 700,
              }}
            >
              YOUR RANK
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 44,
                fontWeight: 700,
                color: C.goldBright,
                fontFamily: "'Playfair Display'",
                lineHeight: 1.08,
                marginTop: 10,
                textShadow: `0 2px 12px rgba(0,0,0,0.6)`,
              }}
            >
              {rank.title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                fontStyle: "italic",
                color: C.parchmentDim,
                fontFamily: "'Playfair Display'",
                marginTop: 6,
              }}
            >
              "{rank.subtitle}"
            </div>

            {/* Block pattern */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 26,
              }}
            >
              {blocks.split("").map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    width: 46,
                    height: 46,
                    background:
                      b === "1" ? C.gold : "rgba(245, 237, 220, 0.06)",
                    border: `2px solid ${
                      b === "1" ? C.goldBright : "rgba(245, 237, 220, 0.15)"
                    }`,
                    borderRadius: 7,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: flavor + CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 12,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontStyle: "italic",
              color: C.parchmentDim,
              fontFamily: "'Playfair Display'",
            }}
          >
            {flavor}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 14,
              padding: "14px 42px",
              background: "rgba(221, 176, 124, 0.14)",
              border: `2px solid ${C.gold}`,
              borderRadius: 14,
              fontSize: 26,
              fontWeight: 700,
              color: C.goldBright,
              letterSpacing: "0.1em",
            }}
          >
            THINK YOU CAN BEAT ME? →
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Playfair Display", data: playfairBold, weight: 700, style: "normal" },
        { name: "Playfair Display", data: playfairItalic, weight: 400, style: "italic" },
        { name: "DM Sans", data: dmBold, weight: 700, style: "normal" },
      ],
      emoji: "twemoji",
    }
  );
}

// ── Duel image ───────────────────────────────────────────────────────────────

async function duelImage(params: URLSearchParams) {
  const selfName = (params.get("a") ?? "Player 1").slice(0, 16);
  const selfScore = clamp(parseInt(params.get("b") ?? "0", 10) || 0, 0, 99);
  const selfAvatar = params.get("c") ?? "🦊";
  const oppName = (params.get("x") ?? "Rival").slice(0, 16);
  const oppScore = clamp(parseInt(params.get("y") ?? "0", 10) || 0, 0, 99);
  const oppAvatar = params.get("z") ?? "🐉";
  const totalRounds = clamp(parseInt(params.get("n") ?? "10", 10) || 10, 1, 30);
  const selfBlocks = parseBlocks(params.get("h"), totalRounds);
  const oppBlocks = parseBlocks(params.get("g"), totalRounds);

  const margin = selfScore - oppScore;
  const headline = margin > 0 ? "VICTORY" : margin < 0 ? "DEFEAT" : "DEADLOCK";
  const flavor = duelFlavor(margin);

  const textSample =
    "GUESS THE ASIAN DUEL asianguesser.com FINAL OF VS VICTORY DEFEAT DEADLOCK " +
    "0123456789 " +
    selfName +
    oppName +
    flavor +
    "Can you do better?";

  const [playfairBold, playfairItalic, dmBold] = await Promise.all([
    loadGoogleFont("Playfair+Display:wght@700", textSample),
    loadGoogleFont("Playfair+Display:ital@1&display=swap", textSample),
    loadGoogleFont("DM+Sans:wght@700", textSample),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: `radial-gradient(ellipse at 50% 0%, ${C.bgMid} 0%, ${C.bgDark} 80%)`,
          padding: "42px 60px",
          fontFamily: "'DM Sans'",
          color: C.parchment,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: `2px solid ${C.border}`,
            borderRadius: 18,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: `1px solid ${C.borderSoft}`,
            borderRadius: 12,
            display: "flex",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              letterSpacing: "0.28em",
              color: C.gold,
              fontWeight: 700,
            }}
          >
            🌏 GUESS THE ASIAN  ⚔  DUEL
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 18,
              fontStyle: "italic",
              color: C.parchmentFaint,
              fontFamily: "'Playfair Display'",
            }}
          >
            asianguesser.com
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 8,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 700,
              color: C.goldBright,
              fontFamily: "'Playfair Display'",
              letterSpacing: "0.12em",
              textShadow: `0 0 24px ${C.gold}`,
            }}
          >
            {headline}
          </div>
        </div>

        {/* VS layout */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
            zIndex: 1,
          }}
        >
          <DuelPlayerColumn
            name={selfName}
            avatar={selfAvatar}
            winner={margin > 0}
            blocks={selfBlocks}
          />

          {/* Center score */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 16,
                letterSpacing: "0.35em",
                color: C.parchmentFaint,
                fontWeight: 700,
              }}
            >
              FINAL
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontFamily: "'Playfair Display'",
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  fontSize: 120,
                  color: margin > 0 ? C.goldBright : C.parchmentDim,
                  lineHeight: 0.9,
                  textShadow: margin > 0 ? `0 0 30px ${C.gold}` : "none",
                }}
              >
                {selfScore}
              </div>
              <div
                style={{
                  fontSize: 70,
                  color: C.parchmentFaint,
                  padding: "0 16px",
                }}
              >
                –
              </div>
              <div
                style={{
                  fontSize: 120,
                  color: margin < 0 ? C.goldBright : C.parchmentDim,
                  lineHeight: 0.9,
                  textShadow: margin < 0 ? `0 0 30px ${C.gold}` : "none",
                }}
              >
                {oppScore}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 14,
                letterSpacing: "0.3em",
                color: C.parchmentFaint,
                fontWeight: 700,
              }}
            >
              OF {totalRounds}
            </div>
          </div>

          <DuelPlayerColumn
            name={oppName}
            avatar={oppAvatar}
            winner={margin < 0}
            blocks={oppBlocks}
          />
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 8,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontStyle: "italic",
              color: C.parchmentDim,
              fontFamily: "'Playfair Display'",
            }}
          >
            {flavor}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 12,
              padding: "12px 38px",
              background: "rgba(221, 176, 124, 0.14)",
              border: `2px solid ${C.gold}`,
              borderRadius: 14,
              fontSize: 24,
              fontWeight: 700,
              color: C.goldBright,
              letterSpacing: "0.1em",
            }}
          >
            CAN YOU DO BETTER? ⚔
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Playfair Display", data: playfairBold, weight: 700, style: "normal" },
        { name: "Playfair Display", data: playfairItalic, weight: 400, style: "italic" },
        { name: "DM Sans", data: dmBold, weight: 700, style: "normal" },
      ],
      emoji: "twemoji",
    }
  );
}

function DuelPlayerColumn({
  name,
  avatar,
  winner,
  blocks,
}: {
  name: string;
  avatar: string;
  winner: boolean;
  blocks: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 260,
      }}
    >
      <div
        style={{
          display: "flex",
          width: 116,
          height: 116,
          borderRadius: 58,
          background: winner
            ? "rgba(221, 176, 124, 0.22)"
            : "rgba(245, 237, 220, 0.05)",
          border: `3px solid ${winner ? C.goldBright : C.border}`,
          alignItems: "center",
          justifyContent: "center",
          fontSize: 68,
        }}
      >
        {avatar}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 30,
          fontWeight: 700,
          color: winner ? C.goldBright : C.parchmentDim,
          fontFamily: "'Playfair Display'",
          marginTop: 12,
          textShadow: winner ? `0 0 14px ${C.gold}` : "none",
        }}
      >
        {name}
      </div>
      <div
        style={{
          display: "flex",
          gap: 5,
          marginTop: 14,
        }}
      >
        {blocks.split("").map((b, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              width: 18,
              height: 18,
              background: b === "1" ? C.gold : "rgba(245, 237, 220, 0.06)",
              border: `1.5px solid ${
                b === "1" ? C.goldBright : "rgba(245, 237, 220, 0.15)"
              }`,
              borderRadius: 3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
