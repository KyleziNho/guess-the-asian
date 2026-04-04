export const AVATARS = [
  "🦊",
  "🐉",
  "🐯",
  "🐼",
  "🦚",
  "🦉",
  "🐇",
  "🐍",
  "🦢",
  "🐺",
  "🦅",
  "🐢",
] as const;

export interface ColorTheme {
  id: string;
  label: string;
  base: string; // main hex
  glow: string; // rgba for glow
  dim: string; // dimmed variant
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: "gold",
    label: "Gold",
    base: "#DDB07C",
    glow: "rgba(221, 176, 124, 0.55)",
    dim: "#B88F5A",
  },
  {
    id: "jade",
    label: "Jade",
    base: "#7CC4A3",
    glow: "rgba(124, 196, 163, 0.55)",
    dim: "#5AA382",
  },
  {
    id: "crimson",
    label: "Crimson",
    base: "#D47A7A",
    glow: "rgba(212, 122, 122, 0.55)",
    dim: "#B05858",
  },
  {
    id: "sapphire",
    label: "Sapphire",
    base: "#8AA8D4",
    glow: "rgba(138, 168, 212, 0.55)",
    dim: "#6486B3",
  },
  {
    id: "violet",
    label: "Violet",
    base: "#B58ED4",
    glow: "rgba(181, 142, 212, 0.55)",
    dim: "#906BAF",
  },
  {
    id: "rose",
    label: "Rose",
    base: "#D48BA7",
    glow: "rgba(212, 139, 167, 0.55)",
    dim: "#AF6983",
  },
];

export const COLOR_MAP: Record<string, ColorTheme> = Object.fromEntries(
  COLOR_THEMES.map((c) => [c.id, c])
);

export function getColorTheme(id: string): ColorTheme {
  return COLOR_MAP[id] ?? COLOR_THEMES[0];
}

export const REACTION_EMOJIS = ["🔥", "😂", "💀", "👏", "🤔", "😭"] as const;

export const MIN_ROUNDS = 5;
export const MAX_ROUNDS = 20;
export const REACTION_RATE_LIMIT_MS = 500;
