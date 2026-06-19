import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabProgress } from "@/hooks/use-vocab-progress";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";

export default function RevisionScreen() {
  const theme = useTheme();

  const { items: vocabulary } = useVocabularyData();
  const {
  getStatus,
  learnedCount,
  pendingCount,
} = useVocabProgress();

const revisionWords = vocabulary.filter(
  (item) => getStatus(item) === "Learned"
);
return (

  <ThemedView
    style={[styles.page, { backgroundColor: theme.background }]}
  >
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>
          <ThemedText type="subtitle">
            Revision Dashboard
          </ThemedText>

          <ThemedText
            type="default"
            themeColor="textSecondary"
            style={styles.description}
          >
            Review all learned vocabulary words.
          </ThemedText>
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.surface },
          ]}
        >
          <ThemedText type="smallBold">
            Statistics
          </ThemedText>

          <View style={styles.summaryRow}>
            <View style={styles.summaryMetric}>
              <ThemedText type="subtitle">
                {learnedCount}
              </ThemedText>

              <ThemedText
                type="small"
                themeColor="textSecondary"
              >
                Learned
              </ThemedText>
            </View>

            <View style={styles.summaryMetric}>
              <ThemedText type="subtitle">
                {pendingCount}
              </ThemedText>

              <ThemedText
                type="small"
                themeColor="textSecondary"
              >
                Pending
              </ThemedText>
            </View>

            <View style={styles.summaryMetric}>
              <ThemedText type="subtitle">
                {revisionWords.length}
              </ThemedText>

              <ThemedText
                type="small"
                themeColor="textSecondary"
              >
                Revision
              </ThemedText>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.analyticsCard,
            { backgroundColor: theme.surface },
          ]}
        >
          <ThemedText type="smallBold">
            Learning Progress
          </ThemedText>

          <View style={styles.progressRow}>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max(
                    20,
                    Math.min(
                      120,
                      learnedCount * 4
                    )
                  ),
                  backgroundColor: "#22C55E",
                },
              ]}
            />

            <View
              style={[
                styles.bar,
                {
                  height: Math.max(
                    20,
                    Math.min(
                      120,
                      pendingCount * 4
                    )
                  ),
                  backgroundColor: "#F97316",
                },
              ]}
            />
          </View>
        </View>

        {revisionWords.length === 0 ? (
          <ThemedText
            type="default"
            themeColor="textSecondary"
          >
            No learned words available.
          </ThemedText>
        ) : (
          revisionWords.map((item) => (
            <View
              key={item.id || item.word}
              style={[
                styles.card,
                {
                  backgroundColor:
                    theme.surface,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent:
                    "space-between",
                }}
              >
                <ThemedText type="smallBold">
                  {item.word}
                </ThemedText>

                <ThemedText
                  type="small"
                  style={{
                    color: "#22C55E",
                  }}
                >
                  Learned
                </ThemedText>
              </View>

              <ThemedText
                type="default"
                themeColor="textSecondary"
              >
                {item.hindiMeaning}
              </ThemedText>

              {item.mnemonic ? (
                <ThemedText
                  type="small"
                  themeColor="textSecondary"
                >
                  💡 {item.mnemonic}
                </ThemedText>
              ) : null}
            </View>
          ))
        )}

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
