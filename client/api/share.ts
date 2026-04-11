export const config = { runtime: "edge" };

const DESCRIPTION =
  "Can you tell where someone is from just by looking at them? Test your skills solo or duel a friend.";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams;
  const origin = url.origin;

  // Forward all params to the OG image endpoint
  const ogImageUrl = `${origin}/api/og?${params.toString()}`;
  const mode = params.get("m") ?? "s";

  let title: string;
  let description: string;

  if (mode === "d") {
    const selfName = params.get("a") ?? "Someone";
    const selfScore = params.get("b") ?? "0";
    const oppName = params.get("x") ?? "Opponent";
    const oppScore = params.get("y") ?? "0";
    const sNum = parseInt(selfScore, 10) || 0;
    const oNum = parseInt(oppScore, 10) || 0;
    const outcome =
      sNum > oNum
        ? `${selfName} beat ${oppName}`
        : sNum < oNum
          ? `${oppName} beat ${selfName}`
          : `${selfName} tied ${oppName}`;
    title = `${outcome} · ${selfScore}–${oppScore} · Guess The Asian`;
    description = `Duel settled. Think you could do better? Tap to play.`;
  } else {
    const score = parseInt(params.get("s") ?? "0", 10) || 0;
    const pct = Math.round((score / 10) * 100);
    title = `${pct}% · Guess The Asian`;
    description = `I scored ${score}/10 on Guess The Asian. Think you can beat me?`;
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Guess The Asian" />
<meta property="og:url" content="${origin}/" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${ogImageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="${escapeHtml(DESCRIPTION)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${ogImageUrl}" />
<link rel="canonical" href="${origin}/" />
<meta http-equiv="refresh" content="0; url=/" />
<style>
  body {
    background: #1C1108;
    color: #F5EDDC;
    font-family: -apple-system, system-ui, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
  }
  a { color: #DDB07C; }
</style>
</head>
<body>
<p>Redirecting to <a href="/">Guess The Asian</a>…</p>
<script>window.location.replace('/');</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
