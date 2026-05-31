import { Pressable, StyleSheet, View } from "react-native";

import { ProgressBar } from "@/components/progress-bar";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function DailyTargetCard({
  totalWords = 0,
  learnedWords = 0,
  pendingWords = 0,
  dailyTarget = 30,
  completedToday = 0,
  remainingToday = 0,
  setDailyTarget,
}) {
  const theme = useTheme();
  const completion = Math.min(
    Math.max(dailyTarget > 0 ? completedToday / dailyTarget : 0, 0),
    1,
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.topRow}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Today's target
          </ThemedText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
  <Pressable
    onPress={() => setDailyTarget(Math.max(10, dailyTarget - 10))}
  >
    <ThemedText type="subtitle">➖</ThemedText>
  </Pressable>

  <ThemedText type="subtitle">
    {dailyTarget} words
  </ThemedText>

  <Pressable
    onPress={() => setDailyTarget(Math.min(100, dailyTarget + 10))}
  >
    <ThemedText type="subtitle">➕</ThemedText>
  </Pressable>
</View>
        </View>
        <View style={styles.metricStack}>
          <View style={styles.metricItem}>
            <ThemedText type="small" themeColor="textSecondary">
              Completed
            </ThemedText>
            <ThemedText type="subtitle">{completedToday}</ThemedText>
          </View>
          <View style={styles.metricItem}>
            <ThemedText type="small" themeColor="textSecondary">
              Remaining
            </ThemedText>
            <ThemedText type="subtitle">{remainingToday}</ThemedText>
          </View>
        </View>
      </View>

      <ProgressBar value={completion} />

      <View style={styles.bottomRow}>
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Total words
            </ThemedText>
            <ThemedText type="subtitle">{totalWords}</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Learned
            </ThemedText>
            <ThemedText type="subtitle">{learnedWords}</ThemedText>
          </View>
          <View style={styles.metricCard}>
            <ThemedText type="small" themeColor="textSecondary">
              Pending
            </ThemedText>
            <ThemedText type="subtitle">{pendingWords}</ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.four,
  },
  metricStack: {
    alignItems: "flex-end",
    gap: Spacing.two,
  },
  metricItem: {
    alignItems: "flex-end",
  },
  bottomRow: {
    marginTop: Spacing.three,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  metricCard: {
    flex: 1,
    borderRadius: Spacing.five,
    padding: Spacing.three,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
});
