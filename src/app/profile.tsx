import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { questionById } from "@/data/questions";
import { shortDate } from "@/engine/day";
import { MIN_PREDICTIONS_FOR_RATING, ratingLabel } from "@/engine/scoring";
import { useGut } from "@/store/GutProvider";
import type { Prediction } from "@/store/gut";
import { colors, space } from "@/ui/theme";

function receiptText(p: Prediction, streak: number): string {
  const q = questionById(p.questionId);
  const crowd = p.crowdPctAtClose! < 50 ? ` when only ${p.crowdPctAtClose}% agreed` : "";
  const streakLine = streak > 0 ? ` ${streak} day streak.` : "";
  return `Called it on ${shortDate(Date.parse(p.predictedAt))}${crowd}.\n"${q.text}" — ${p.side}. +${p.points} on Gut.${streakLine}`;
}

export default function ProfileScreen() {
  const { state, stats, skipHours, reset } = useGut();
  const insets = useSafeAreaInsets();
  const resolved = state.predictions
    .filter((p) => p.points !== null)
    .sort((a, b) => questionById(b.questionId).resolvesAt - questionById(a.questionId).resolvesAt);
  const pending = state.predictions.length - resolved.length;
  const toGo = MIN_PREDICTIONS_FOR_RATING - stats.resolved;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space(4) }]}
    >
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>GUT</Text>
        <Text style={styles.heroNumber}>{ratingLabel(stats.rating, stats.resolved)}</Text>
        <Text style={styles.sub}>
          {stats.resolved} predictions{toGo > 0 ? ` · rating shows after ${toGo} more` : ""}
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Hit rate" value={stats.hitRate === null ? "–" : `${stats.hitRate}%`} />
        <Stat label="Underdog calls" value={String(stats.underdogCalls)} />
        <Stat label="Best streak" value={String(stats.bestStreak)} />
      </View>
      <View style={styles.stats}>
        <Stat label="This month" value={`${stats.monthPoints > 0 ? "+" : ""}${stats.monthPoints}`} />
        <Stat label="Day streak" value={String(stats.dayStreak)} />
        <Stat label="Freezes" value={`${stats.freezes}/2`} />
      </View>

      <Text style={styles.section}>Results{pending ? ` · ${pending} pending` : ""}</Text>
      {resolved.length === 0 && <Text style={styles.sub}>Nothing resolved yet.</Text>}
      {resolved.map((p) => {
        const won = p.points! > 0;
        return (
          <View key={p.questionId} style={styles.result}>
            <Text style={styles.resultText}>{questionById(p.questionId).text}</Text>
            <View style={styles.resultRow}>
              <Text style={[styles.points, { color: won ? colors.yes : colors.no }]}>
                {p.side}
                {p.boost > 1 ? ` ${p.boost}x` : ""} · {won ? "+" : "−"}
                {Math.abs(p.points!)}
              </Text>
              {won && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => Share.share({ message: receiptText(p, stats.dayStreak) })}
                >
                  <Text style={styles.share}>Share receipt</Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      })}

      {__DEV__ && (
        <View style={styles.dev}>
          <Text style={styles.sub}>Dev clock: +{Math.round(state.devOffsetMs / 3_600_000)}h</Text>
          <View style={styles.resultRow}>
            <Pressable accessibilityRole="button" onPress={() => skipHours(24)}>
              <Text style={styles.share}>Skip 1 day</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => skipHours(24 * 14)}>
              <Text style={styles.share}>Skip 14 days</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={reset}>
              <Text style={[styles.share, { color: colors.no }]}>Reset</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), gap: space(3), paddingBottom: space(10) },
  hero: { alignItems: "center", paddingVertical: space(4) },
  heroLabel: { color: colors.accent, fontSize: 13, fontWeight: "800", letterSpacing: 2 },
  heroNumber: { color: colors.text, fontSize: 96, fontWeight: "800", lineHeight: 104 },
  sub: { color: colors.textDim, fontSize: 13 },
  stats: { flexDirection: "row", gap: space(3) },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: space(3),
    alignItems: "center",
  },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800" },
  statLabel: { color: colors.textDim, fontSize: 11, marginTop: 2 },
  section: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: space(4) },
  result: { backgroundColor: colors.surface, borderRadius: 14, padding: space(3), gap: space(2) },
  resultText: { color: colors.text, fontSize: 14 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  points: { fontSize: 14, fontWeight: "800" },
  share: { color: colors.accent, fontSize: 14, fontWeight: "700" },
  dev: { marginTop: space(6), borderTopWidth: 1, borderTopColor: colors.border, paddingTop: space(3), gap: space(2) },
});
