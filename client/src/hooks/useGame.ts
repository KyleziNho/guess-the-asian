import { useReducer, useCallback } from "react";
import type { GameState, GameAction, Person } from "../lib/types";
import { TOTAL_ROUNDS, NUM_OPTIONS, COUNTRIES, API_BASE } from "../lib/constants";
import { queueImages } from "../lib/imageCache";

// Buffered batch for the *next* game. Prefetched on page load and again
// whenever a game starts, so "Play Again" is effectively instant.
let bufferedPeople: Person[] | null = null;
let bufferPromise: Promise<Person[]> | null = null;

async function fetchPeople(): Promise<Person[]> {
  const res = await fetch(`${API_BASE}/random?count=${TOTAL_ROUNDS}`);
  return res.json();
}

function ensureBuffer(): Promise<Person[]> {
  if (bufferedPeople) return Promise.resolve(bufferedPeople);
  if (bufferPromise) return bufferPromise;
  bufferPromise = fetchPeople()
    .then((people) => {
      bufferedPeople = people;
      bufferPromise = null;
      queueImages(people.map((p) => p.image_url));
      return people;
    })
    .catch((err) => {
      bufferPromise = null;
      throw err;
    });
  return bufferPromise;
}

// Kick off the first prefetch as soon as the module loads (on page load).
if (typeof window !== "undefined") {
  ensureBuffer().catch(() => {
    /* ignore — user will retry when they click Start */
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(people: Person[]): string[][] {
  const allNames = COUNTRIES.map((c) => c.name);
  return people.map((person) => {
    const distractors = shuffle(allNames.filter((c) => c !== person.country)).slice(
      0,
      NUM_OPTIONS - 1
    );
    return shuffle([...distractors, person.country]);
  });
}

const initialState: GameState = {
  phase: "start",
  people: [],
  options: [],
  currentRound: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  results: [],
  lastGuessCorrect: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...initialState,
        phase: "playing",
        people: action.people,
        options: generateOptions(action.people),
      };

    case "GUESS": {
      const person = state.people[state.currentRound];
      const correct = action.country === person.country;
      const newStreak = correct ? state.streak + 1 : 0;
      return {
        ...state,
        phase: "result",
        score: correct ? state.score + 1 : state.score,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        lastGuessCorrect: correct,
        results: [
          ...state.results,
          { person, guess: action.country, correct },
        ],
      };
    }

    case "NEXT_ROUND": {
      const nextRound = state.currentRound + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        return { ...state, phase: "gameover" };
      }
      return {
        ...state,
        phase: "playing",
        currentRound: nextRound,
        lastGuessCorrect: null,
      };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const startGame = useCallback(async () => {
    // Use the prefetched batch if it's ready; otherwise wait on the in-flight
    // fetch (or kick off a new one). Images are queued as part of the buffer
    // fill, so they're already streaming in by the time we get here.
    const people = bufferedPeople ?? (await ensureBuffer());
    bufferedPeople = null;
    dispatch({ type: "START_GAME", people });

    // Immediately start prefetching the *next* game so Play Again is instant.
    ensureBuffer().catch(() => {
      /* ignore — retry happens on next click */
    });
  }, []);

  const guess = useCallback((country: string) => {
    dispatch({ type: "GUESS", country });
  }, []);

  const nextRound = useCallback(() => {
    dispatch({ type: "NEXT_ROUND" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return { state, startGame, guess, nextRound, reset };
}
