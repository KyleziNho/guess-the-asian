export const COUNTRIES = [
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "Malaysia", flag: "🇲🇾" },
  { name: "Thailand", flag: "🇹🇭" },
  { name: "China", flag: "🇨🇳" },
  { name: "Vietnam", flag: "🇻🇳" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "Japan", flag: "🇯🇵" },
] as const;

export const COUNTRY_MAP = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c.flag])
) as Record<string, string>;

export const TOTAL_ROUNDS = 10;
export const NUM_OPTIONS = 4;
export const RESULT_DISPLAY_MS = 1200;
// In dev, Vite proxies /api to the local server. In prod (Vercel), point at
// the Railway backend via VITE_API_BASE (e.g. https://your-app.up.railway.app).
export const API_BASE = import.meta.env.VITE_API_BASE || "/api";
