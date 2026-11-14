import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Question } from "../data/questions";
import type { Boost, Side } from "../engine/scoring";
import { clearState, deriveStats, loadState, lockPrediction, resolveDue, saveState, type GutState, type Stats } from "./gut";

type GutContext = {
  state: GutState;
  now: number;
  stats: Stats;
  lock: (q: Question, side: Side, boost: Boost) => void;
  markShown: (ids: string[]) => void;
  skipHours: (h: number) => void;
  reset: () => void;
};

const Ctx = createContext<GutContext | null>(null);

export function useGut(): GutContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGut must be used inside GutProvider");
  return ctx;
}

export function GutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GutState | null>(null);
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    loadState().then(setState);
    const id = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const now = tick + (state?.devOffsetMs ?? 0);

  // Every change goes through here so due predictions are resolved and persisted in one place.
  const update = useCallback((fn: (s: GutState) => GutState) => {
    setState((prev) => {
      if (!prev) return prev;
      const changed = fn(prev);
      const next = resolveDue(changed, Date.now() + changed.devOffsetMs);
      if (next !== prev) saveState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    update((s) => s);
  }, [now, update]);

  const value = useMemo<GutContext | null>(() => {
    if (!state) return null;
    return {
      state,
      now,
      stats: deriveStats(state, now),
      lock: (q, side, boost) => update((s) => lockPrediction(s, q, side, boost, Date.now() + s.devOffsetMs)),
      markShown: (ids) =>
        update((s) => {
          const fresh = ids.filter((id) => !s.shownAt[id]);
          if (!fresh.length) return s;
          const at = new Date(Date.now() + s.devOffsetMs).toISOString();
          return { ...s, shownAt: { ...s.shownAt, ...Object.fromEntries(fresh.map((id) => [id, at])) } };
        }),
      skipHours: (h) => update((s) => ({ ...s, devOffsetMs: s.devOffsetMs + h * 3_600_000 })),
      reset: () => {
        clearState().then(loadState).then(setState);
      },
    };
  }, [state, now, update]);

  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
