import { atHour, dayNumber } from "../engine/day";
import type { Side } from "../engine/scoring";

export type Category = "cricket" | "bollywood" | "internet" | "slow";

export type Question = {
  id: string;
  day: string;
  slot: 1 | 2 | 3 | 4;
  category: Category;
  text: string;
  /** Whose number counts. A question without source + threshold + deadline never goes live. */
  source: string;
  resolvesAt: number;
  crowdYes: number;
  crowdYesAtClose: number;
  outcome: Side;
};

type Seed = { text: string; source: string; crowdYes: number; crowdYesAtClose: number; outcome: Side };

/**
 * SAMPLE DATA. Placeholder questions with made-up crowd numbers and outcomes so
 * the loop is playable offline. Replace with the backend feed (supabase/schema.sql)
 * before anyone outside the team sees it.
 */
const POOL: Record<Category, Seed[]> = {
  cricket: [
    { text: "Will India score more than 180 batting first in tonight's T20I?", source: "ESPNcricinfo scorecard", crowdYes: 64, crowdYesAtClose: 68, outcome: "NO" },
    { text: "Will tonight's match have more than 14 sixes in total?", source: "ESPNcricinfo scorecard", crowdYes: 41, crowdYesAtClose: 38, outcome: "YES" },
    { text: "Will the team winning the toss win tonight's match?", source: "ESPNcricinfo scorecard", crowdYes: 55, crowdYesAtClose: 57, outcome: "YES" },
    { text: "Will any batter score 75 or more in tonight's match?", source: "ESPNcricinfo scorecard", crowdYes: 27, crowdYesAtClose: 24, outcome: "YES" },
  ],
  bollywood: [
    { text: "Will this Friday's big release cross ₹15 crore Day 1 India net?", source: "Fixed box office source (TBD)", crowdYes: 72, crowdYesAtClose: 75, outcome: "NO" },
    { text: "Will this week's top OTT release be #1 on its platform's India chart on Sunday?", source: "Platform's public Top 10", crowdYes: 60, crowdYesAtClose: 58, outcome: "YES" },
    { text: "Will last Friday's release collect more on its 2nd Saturday than its 2nd Friday by over 40%?", source: "Fixed box office source (TBD)", crowdYes: 35, crowdYesAtClose: 28, outcome: "YES" },
  ],
  internet: [
    { text: "Will today's #1 trending YouTube India video cross 10 million views by tomorrow 9 pm?", source: "YouTube public view count", crowdYes: 82, crowdYesAtClose: 85, outcome: "YES" },
    { text: "Will the trailer dropping today cross 20 million views in 24 hours?", source: "YouTube public view count", crowdYes: 48, crowdYesAtClose: 45, outcome: "NO" },
    { text: "Will today's top X India trend still be in the top 10 at 9 pm tomorrow?", source: "X India trends list", crowdYes: 22, crowdYesAtClose: 19, outcome: "NO" },
  ],
  slow: [
    { text: "Will the RBI cut the repo rate at its next policy meeting?", source: "RBI press release", crowdYes: 44, crowdYesAtClose: 40, outcome: "NO" },
    { text: "Will Nifty 50 close above its current level two weeks from today?", source: "NSE closing price", crowdYes: 66, crowdYesAtClose: 70, outcome: "YES" },
    { text: "Will petrol in Delhi cost more two weeks from today than it does now?", source: "IOCL published price", crowdYes: 18, crowdYesAtClose: 16, outcome: "NO" },
  ],
};

/** [category, days after drop, hour] per slot. Results land at the 9 pm reveal unless the source dictates otherwise. */
const SLOTS: [Category, number, number][] = [
  ["cricket", 0, 23],
  ["bollywood", 2, 12],
  ["internet", 1, 21],
  ["slow", 14, 21],
];

function questionFor(day: string, slot: 1 | 2 | 3 | 4): Question {
  const [category, plusDays, hour] = SLOTS[slot - 1];
  const pool = POOL[category];
  const seed = pool[dayNumber(day) % pool.length];
  return {
    id: `q_${day.replace(/-/g, "_")}_${slot}`,
    day,
    slot,
    category,
    ...seed,
    resolvesAt: atHour(day, plusDays, hour),
  };
}

/** Everyone gets the same 4, in the same order. */
export function questionsFor(day: string): Question[] {
  return ([1, 2, 3, 4] as const).map((slot) => questionFor(day, slot));
}

export function questionById(id: string): Question {
  const [, y, m, d, slot] = id.split("_");
  return questionFor(`${y}-${m}-${d}`, Number(slot) as 1 | 2 | 3 | 4);
}
