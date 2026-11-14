import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Question } from "@/data/questions";
import { BASE_POINTS, stake, type Boost, type Side } from "@/engine/scoring";
import type { Prediction } from "@/store/gut";
import { colors, space } from "./theme";

const CATEGORY_LABEL = { cricket: "CRICKET", bollywood: "BOLLYWOOD / OTT", internet: "INTERNET", slow: "SLOW BURN" } as const;

function when(ms: number): string {
  return new Date(ms).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric" });
}

type Props = {
  question: Question;
  prediction?: Prediction;
  /** Boosts already spent on other questions today — one 2x and one 3x per day. */
  boostsUsed: Boost[];
  onLock: (side: Side, boost: Boost) => void;
};

export function QuestionCard({ question: q, prediction, boostsUsed, onLock }: Props) {
  const [side, setSide] = useState<Side | null>(null);
  const [picked, setBoost] = useState<Boost>(1);
  // A boost picked here may since have been spent on another card.
  const boost: Boost = boostsUsed.includes(picked) ? 1 : picked;

  const lopsided = Math.max(q.crowdYes, 100 - q.crowdYes);
  const crowdSide: Side = q.crowdYes >= 50 ? "YES" : "NO";

  return (
    <View style={styles.card}>
      <Text style={styles.category}>{CATEGORY_LABEL[q.category]}</Text>
      <Text style={styles.text}>{q.text}</Text>
      <Text style={styles.meta}>
        Source: {q.source} · Resolves {when(q.resolvesAt)}
      </Text>

      <View style={styles.crowdBar}>
        <View style={{ flex: q.crowdYes, backgroundColor: colors.yes }} />
        <View style={{ flex: 100 - q.crowdYes, backgroundColor: colors.no }} />
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>YES {q.crowdYes}%</Text>
        <Text style={styles.meta}>NO {100 - q.crowdYes}%</Text>
      </View>
      {!prediction && lopsided >= 80 && (
        <Text style={styles.nudge}>
          {lopsided}% say {crowdSide}. Going against them?
        </Text>
      )}

      {prediction ? (
        <Locked prediction={prediction} />
      ) : (
        <>
          <View style={styles.sides}>
            {(["YES", "NO"] as const).map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                onPress={() => setSide(s)}
                style={[
                  styles.sideBtn,
                  { borderColor: s === "YES" ? colors.yes : colors.no },
                  side === s && { backgroundColor: s === "YES" ? colors.yes : colors.no },
                ]}
              >
                <Text style={[styles.sideText, side === s && { color: colors.onAccent }]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {side && (
            <>
              <View style={styles.chips}>
                {([1, 2, 3] as const).map((b) => {
                  const spent = boostsUsed.includes(b);
                  return (
                    <Pressable
                      key={b}
                      accessibilityRole="button"
                      disabled={spent}
                      onPress={() => setBoost(b)}
                      style={[styles.chip, boost === b && styles.chipOn, spent && { opacity: 0.35 }]}
                    >
                      <Text style={[styles.chipText, boost === b && { color: colors.onAccent }]}>{b}x</Text>
                    </Pressable>
                  );
                })}
                <Text style={styles.stakes}>
                  Win +{stake(boost)} / Lose −{stake(boost)}
                </Text>
              </View>
              <Pressable accessibilityRole="button" style={styles.lock} onPress={() => onLock(side, boost)}>
                <Text style={styles.lockText}>Lock {side}</Text>
              </Pressable>
            </>
          )}
        </>
      )}
    </View>
  );
}

function Locked({ prediction: p }: { prediction: Prediction }) {
  const call = `${p.side}${p.boost > 1 ? ` · ${p.boost}x` : ""}`;
  if (p.points === null) {
    return <Text style={styles.locked}>Locked {call}. Result pending.</Text>;
  }
  const won = p.points > 0;
  const underdog = won && p.points > BASE_POINTS * p.boost;
  return (
    <Text style={[styles.locked, { color: won ? colors.yes : colors.no }]}>
      {won ? "Called it" : "Missed"} · {call} · {won ? "+" : "−"}
      {Math.abs(p.points)}
      {underdog ? " (underdog 2x)" : ""}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: space(4),
    gap: space(2),
  },
  category: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  text: { color: colors.text, fontSize: 19, fontWeight: "700", lineHeight: 25 },
  meta: { color: colors.textDim, fontSize: 12 },
  crowdBar: { flexDirection: "row", height: 6, borderRadius: 3, overflow: "hidden", marginTop: space(1) },
  row: { flexDirection: "row", justifyContent: "space-between" },
  nudge: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  sides: { flexDirection: "row", gap: space(3), marginTop: space(2) },
  sideBtn: { flex: 1, borderWidth: 2, borderRadius: 14, paddingVertical: space(3.5), alignItems: "center" },
  sideText: { color: colors.text, fontSize: 17, fontWeight: "800" },
  chips: { flexDirection: "row", alignItems: "center", gap: space(2), marginTop: space(1) },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: space(4),
    paddingVertical: space(2),
  },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontWeight: "800" },
  stakes: { color: colors.textDim, fontSize: 13, marginLeft: "auto" },
  lock: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: space(3.5), alignItems: "center" },
  lockText: { color: colors.onAccent, fontSize: 16, fontWeight: "800" },
  locked: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: space(2) },
});
