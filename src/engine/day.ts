/** The day's 4 questions drop at 8 am; before that, "today" is still yesterday's set. */
export const DROP_HOUR = 8;

const pad = (n: number) => String(n).padStart(2, "0");

function keyOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayKeyFor(ms: number): string {
  const d = new Date(ms);
  if (d.getHours() < DROP_HOUR) d.setDate(d.getDate() - 1);
  return keyOf(d);
}

/** Local time on `key` (+ `plusDays`) at `hour`:00, in ms. */
export function atHour(key: string, plusDays: number, hour: number): number {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d + plusDays, hour).getTime();
}

export function addDays(key: string, n: number): string {
  return keyOf(new Date(atHour(key, n, 12)));
}

/** Stable integer per calendar day, used to rotate the question pool. */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function monthKey(ms: number): string {
  return keyOf(new Date(ms)).slice(0, 7);
}

export function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
