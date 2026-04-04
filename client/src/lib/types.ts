export interface Person {
  id: number;
  wikidata_id: string;
  name: string;
  description: string;
  country: string;
  image_url: string;
}

export type GamePhase = "start" | "playing" | "result" | "gameover";

export interface RoundResult {
  person: Person;
  guess: string;
  correct: boolean;
}

export interface GameState {
  phase: GamePhase;
  people: Person[];
  options: string[][];
  currentRound: number;
  score: number;
  streak: number;
  bestStreak: number;
  results: RoundResult[];
  lastGuessCorrect: boolean | null;
}

export type GameAction =
  | { type: "START_GAME"; people: Person[] }
  | { type: "GUESS"; country: string }
  | { type: "NEXT_ROUND" }
  | { type: "RESET" };
