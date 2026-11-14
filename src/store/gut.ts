import AsyncStorage from "@react-native-async-storage/async-storage";
import { questionById, type Category, type Question } from "../data/questions";
import { addDays, dayKeyFor, monthKey } from "../engine/day";
import {
  crowdPctOnSide,
  isUnderdog,
  nextRating,
  scorePrediction,
  START_RATING,
  type Boost,
  type Side,
} from "../engine/scoring";

/**
 * One row per prediction. Field set mirrors supabase/schema.sql — Pro analytics
 * depend on these and none of them can be backfilled later.
 * crowdPct* is the % of the crowd on the user's own side.
 */
export type Prediction = {
  userId: string;
  questionId: string;
  day: string;
  category: Category;
  side: Side;
  boost: Boost;
  crowdPctAtPrediction: number;
  crowdPctAtClose: number | null;
  shownAt: string;
  predictedAt: string;
  outcome: Side | null;
  points: number | null;
};

export type GutState = {
  userId: string;
  predictions: Prediction[];
  /** First time each question was put on screen, for speed-vs-accuracy. */
  shownAt: Record<string, string>;
  /** Dev-only clock offset so resolution and streaks can be tested without waiting. */
  devOffsetMs: number;
};

const KEY = "gut.state.v1";

export async function loadState(): Promise<GutState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) return JSON.parse(raw) as GutState;
  return { userId: `u_${Math.random().toString(36).slice(2, 10)}`, predictions: [], shownAt: {}, devOffsetMs: 0 };
}

export function saveState(state: GutState): Promise<void> {
  return AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export function clearState(): Promise<void> {
  return AsyncStorage.removeItem(KEY);
}

export function lockPrediction(state: GutState, q: Question, side: Side, boost: Boost, now: number): GutState {
  if (state.predictions.some((p) => p.questionId === q.id)) return state;
  const predictedAt = new Date(now).toISOString();
  const row: Prediction = {
    userId: state.userId,
    questionId: q.id,
    day: q.day,
    category: q.category,
    side,
    boost,
    crowdPctAtPrediction: crowdPctOnSide(side, q.crowdYes),
    crowdPctAtClose: null,
    shownAt: state.shownAt[q.id] ?? predictedAt,
    predictedAt,
    outcome: null,
    points: null,
  };
  return { ...state, predictions: [...state.predictions, row] };
}

/** Fills outcome + points on every prediction whose question has resolved. Returns the same object if nothing changed. */
export function resolveDue(state: GutState, now: number): GutState {
  let changed = false;
  const predictions = state.predictions.map((p) => {
    if (p.outcome) return p;
    const q = questionById(p.questionId);
    if (q.resolvesAt > now) return p;
    changed = true;
    return {
      ...p,
      outcome: q.outcome,
      crowdPctAtClose: crowdPctOnSide(p.side, q.crowdYesAtClose),
      points: scorePrediction({ side: p.side, boost: p.boost, outcome: q.outcome, crowdYesAtClose: q.crowdYesAtClose }),
    };
  });
  return changed ? { ...state, predictions } : state;
}

export type Stats = {
  rating: number;
  resolved: number;
  hitRate: number | null;
  underdogCalls: number;
  bestStreak: number;
  monthPoints: number;
  dayStreak: number;
  freezes: number;
};

export function deriveStats(state: GutState, now: number): Stats {
  const resolved = state.predictions
    .filter((p) => p.outcome)
    .map((p) => ({ p, q: questionById(p.questionId) }))
    .sort((a, b) => a.q.resolvesAt - b.q.resolvesAt || a.q.slot - b.q.slot);

  let rating = START_RATING;
  let correct = 0;
  let underdogCalls = 0;
  let run = 0;
  let bestStreak = 0;
  let monthPoints = 0;
  const thisMonth = monthKey(now);

  for (const { p, q } of resolved) {
    rating = nextRating(rating, p.points!);
    if (p.side === p.outcome) {
      correct++;
      run++;
      bestStreak = Math.max(bestStreak, run);
      if (isUnderdog(p.side, q.crowdYesAtClose)) underdogCalls++;
    } else {
      run = 0;
    }
    if (monthKey(q.resolvesAt) === thisMonth) monthPoints += p.points!;
  }

  return {
    rating,
    resolved: resolved.length,
    hitRate: resolved.length ? Math.round((correct / resolved.length) * 100) : null,
    underdogCalls,
    bestStreak,
    monthPoints,
    ...dayStreak(state.predictions, dayKeyFor(now)),
  };
}

/**
 * A streak day = all 4 answered. Every 7th streak day earns a freeze (max 2 stored);
 * a freeze is spent automatically on a missed day. Today only counts once it's complete.
 */
function dayStreak(predictions: Prediction[], today: string): { dayStreak: number; freezes: number } {
  const perDay = new Map<string, number>();
  for (const p of predictions) perDay.set(p.day, (perDay.get(p.day) ?? 0) + 1);
  const days = [...perDay.keys()].sort();
  let streak = 0;
  let freezes = 0;
  if (!days.length) return { dayStreak: streak, freezes };

  for (let d = days[0]; d <= today; d = addDays(d, 1)) {
    if (perDay.get(d) === 4) {
      streak++;
      if (streak % 7 === 0) freezes = Math.min(2, freezes + 1);
    } else if (d === today) {
      break;
    } else if (freezes > 0) {
      freezes--;
    } else {
      streak = 0;
    }
  }
  return { dayStreak: streak, freezes };
}
