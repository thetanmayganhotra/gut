import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { questionsFor } from "@/data/questions";
import { dayKeyFor } from "@/engine/day";
import { ratingLabel, type Boost } from "@/engine/scoring";
import { useGut } from "@/store/GutProvider";
import { QuestionCard } from "@/ui/QuestionCard";
import { colors, space } from "@/ui/theme";

export default function TodayScreen() {
  const { state, now, stats, lock, markShown } = useGut();
  const insets = useSafeAreaInsets();
  const day = dayKeyFor(now);
  const questions = questionsFor(day);
  const todays = state.predictions.filter((p) => p.day === day);
  const boostsUsed = todays.map((p) => p.boost).filter((b): b is Boost => b > 1);

  useEffect(() => {
    markShown(questionsFor(day).map((q) => q.id));
  }, [day, markShown]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space(4) }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today's 4</Text>
          <Text style={styles.sub}>
            {todays.length}/4 locked · {stats.dayStreak} day streak
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.rating}>Gut {ratingLabel(stats.rating, stats.resolved)}</Text>
          <Text style={styles.sub}>{stats.resolved} predictions</Text>
        </View>
      </View>

      {questions.map((q) => (
        <QuestionCard
          key={q.id}
          question={q}
          prediction={todays.find((p) => p.questionId === q.id)}
          boostsUsed={boostsUsed}
          onLock={(side, boost) => lock(q, side, boost)}
        />
      ))}

      {todays.length === 4 && <Text style={styles.done}>That's all 4. Next drop at 8 am.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space(4), gap: space(4), paddingBottom: space(10) },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  rating: { color: colors.accent, fontSize: 22, fontWeight: "800" },
  sub: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  done: { color: colors.textDim, textAlign: "center", fontSize: 15, marginTop: space(2) },
});
