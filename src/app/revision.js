import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";

export default function RevisionScreen() {
  const theme = useTheme();

  const { items: vocabulary } = useVocabularyData();

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="subtitle">Weekly revision</ThemedText>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.description}
            >
              Review your strongest and weakest words with a modern revision
              planner.
            </ThemedText>
          </View>

          <View
            style={[styles.summaryCard, { backgroundColor: theme.surface }]}
          >
            <ThemedText type="smallBold">This week</ThemedText>
            <View style={styles.summaryRow}>
              <View style={styles.summaryMetric}>
                <ThemedText type="subtitle">18</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  words reviewed
                </ThemedText>
              </View>
              <View style={styles.summaryMetric}>
                <ThemedText type="subtitle">2x</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  review pace
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.analyticsCard}>
            <ThemedText type="smallBold">Weekly analytics</ThemedText>
            <View
              style={[styles.progressRow, { backgroundColor: theme.surface }]}
            >
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (day, index) => (
                  <View
                    key={day}
                    style={[
                      styles.bar,
                      { height: 60 - index * 5, backgroundColor: theme.accent },
                    ]}
                  />
                ),
              )}
            </View>
          </View>

          {vocabulary.slice(0, 3).map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: theme.surface }]}
            >
              <ThemedText type="smallBold">{item.word}</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                {item.hindiMeaning}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.label}
              >
                Practice again today
              </ThemedText>
            </View>
          ))}

          <Footer />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  description: {
    lineHeight: 24,
  },
  summaryCard: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  summaryMetric: {
    flex: 1,
  },
  analyticsCard: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: Spacing.four,
    gap: Spacing.two,
  },
  bar: {
    flex: 1,
    borderRadius: Spacing.five,
  },
  card: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  label: {
    marginTop: Spacing.one,
  },
});
