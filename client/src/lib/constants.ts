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
export const API_BASE = "/api";
