export type Side = "YES" | "NO";
export type Boost = 1 | 2 | 3;

export const BASE_POINTS = 10;
export const UNDERDOG_THRESHOLD = 30;
export const MIN_PREDICTIONS_FOR_RATING = 20;
export const START_RATING = 50;

export function stake(boost: Boost): number {
  return BASE_POINTS * boost;
}

/** % of the crowd that was on `side`, given the YES share. */
export function crowdPctOnSide(side: Side, crowdYes: number): number {
  return side === "YES" ? crowdYes : 100 - crowdYes;
}

/** Underdog uses the crowd % at question close, never the live one. */
export function isUnderdog(side: Side, crowdYesAtClose: number): boolean {
  return crowdPctOnSide(side, crowdYesAtClose) < UNDERDOG_THRESHOLD;
}

export function scorePrediction(p: {
  side: Side;
  boost: Boost;
  outcome: Side;
  crowdYesAtClose: number;
}): number {
  if (p.side !== p.outcome) return -stake(p.boost);
  return stake(p.boost) * (isUnderdog(p.side, p.crowdYesAtClose) ? 2 : 1);
}

/** R_new = R_old + points/20 - (R_old - 50)/100, clamped to 1..99. */
export function nextRating(old: number, points: number): number {
  const r = old + points / 20 - (old - START_RATING) / 100;
  return Math.min(99, Math.max(1, r));
}

export function ratingLabel(rating: number, resolvedCount: number): string {
  return resolvedCount < MIN_PREDICTIONS_FOR_RATING ? "?" : String(Math.round(rating));
}
