# Guess The Asian

A face-geography guessing game: you're shown a photo of a person and have to guess which East/Southeast Asian country they're from. Includes a live 2-player duel mode.

## Stack

- **Client** — React 19, TypeScript, Vite 8, Tailwind 4, Framer Motion
- **Server** — Node + Express, SQLite (better-sqlite3), WebSocket (`ws`)
- **Scraper** — Python (pulls people + photos from Wikidata)

## Modes

### Solo
10-round single player. Personal-best tracked in localStorage. Ranked title and flavor line at the end.

### Multiplayer Duel
Real-time 2-player rooms over WebSocket:
- 4-letter room codes, create / join flow
- Customizable profile (12 animal avatars, 6 color themes, name)
- Round-locked sync — both players pick before anyone advances, opponent's pick is hidden until reveal
- Floating emoji reactions during rounds
- Disconnect grace + auto-resume, host can forfeit an absent opponent
- Head-to-head game-over screen with per-round breakdown and rematch

## Run locally

```bash
# 1. Server (WebSocket + API on :3001)
cd server
npm install
npm run dev

# 2. Client (Vite dev server on :5173, proxies /api + /ws)
cd client
npm install
npm run dev
```

Open http://localhost:5173.

## Project layout

```
client/   # React app
server/   # Express + WebSocket server, SQLite game database
scraper/  # Python scripts that populate server/data/game.db from Wikidata
```

## Data

The game database (`server/data/game.db`) contains ~thousands of people across
7 countries. To rebuild it from Wikidata:

```bash
cd scraper
python scrape.py
python validate.py
```

## Deploy

**Client → Vercel, Server → Railway.** The server hosts the API + WebSocket; the
client is a static Vite build that points at it.

### 1. Deploy the server to Railway

1. Go to [railway.com/new](https://railway.com/new) → **Deploy from GitHub** → pick this repo.
2. In the service settings, set **Root Directory** to `server`.
3. Railway reads `server/railway.json` and builds from `server/Dockerfile`.
4. (Optional) add an env var `ALLOWED_ORIGINS` once you know your Vercel URL,
   e.g. `https://guess-the-asian.vercel.app`.
5. Under **Settings → Networking**, generate a public domain. You'll get
   something like `guess-the-asian-production.up.railway.app`.
6. Test it: `curl https://<your-domain>/health` → `{"ok":true}`.

### 2. Deploy the client to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import this repo.
2. Set **Root Directory** to `client`. Vercel auto-detects Vite from
   `client/vercel.json`.
3. Add two environment variables (Production + Preview):
   - `VITE_API_BASE` = `https://<your-railway-domain>/api`
   - `VITE_WS_URL` = `wss://<your-railway-domain>/ws`
4. Deploy. The client will call Railway for both HTTP and WebSocket traffic.

### 3. Lock down CORS (optional)

Once you have your Vercel URL, set `ALLOWED_ORIGINS` on Railway to that URL
(comma-separated for multiple). The server will only accept cross-origin API
requests from listed origins.
