import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabProgress } from "@/hooks/use-vocab-progress";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";
import { readJson, STORAGE_KEYS } from "@/utils/local-storage";

export default function RevisionScreen() {
  const theme = useTheme();
  const { items: vocabulary, loading } = useVocabularyData();
  const { getStatus, learnedCount, pendingCount, weakCount, weakIds, markLearned, markPending, clearWeakWord } = useVocabProgress();
  const [tab, setTab] = useState("due");
  const [history] = useState(() => readJson(STORAGE_KEYS.quizHistory, []));

  const revisionWords = useMemo(() => {
    if (tab === "learned") return vocabulary.filter((item) => getStatus(item) === "Learned");
    if (tab === "pending") return vocabulary.filter((item) => getStatus(item) === "Pending");
    if (tab === "weak") return vocabulary.filter((item) => weakIds.has(item.id));
    return vocabulary.filter((item) => getStatus(item) === "Pending" || weakIds.has(item.id));
  }, [getStatus, tab, vocabulary, weakIds]);

  const latestHistory = Array.isArray(history) ? history.slice(0, 5) : [];

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Revision Dashboard</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
              Practice pending and weak words. Your learning history stays on this browser.
            </ThemedText>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold">Learning overview</ThemedText>
            <View style={styles.summaryRow}>
              {[['Learned', learnedCount], ['Pending', pendingCount], ['Weak', weakCount]].map(([label, value]) => (
                <View key={label} style={styles.summaryMetric}>
                  <ThemedText type="title">{value}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tabRow}>
            {[['due', 'Due now'], ['weak', 'Weak words'], ['pending', 'Pending'], ['learned', 'Learned']].map(([key, label]) => (
              <Pressable key={key} onPress={() => setTab(key)} style={[styles.tab, { backgroundColor: tab === key ? theme.accent : theme.surface }]}>
                <ThemedText type="smallBold">{label}</ThemedText>
              </Pressable>
            ))}
          </View>

          {loading && vocabulary.length === 0 ? <ThemedText themeColor="textSecondary">Loading vocabulary…</ThemedText> : null}
          {!loading && revisionWords.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}>
              <ThemedText type="subtitle">Nothing to revise</ThemedText>
              <ThemedText themeColor="textSecondary">Mark words as pending or take a quiz to build a weak-word list.</ThemedText>
            </View>
          ) : null}

          {revisionWords.map((item) => {
            const status = getStatus(item);
            const isWeak = weakIds.has(item.id);
            return (
              <View key={item.id} style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="subtitle">{item.word}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">{item.category} · {item.difficulty}</ThemedText>
                  </View>
                  <ThemedText type="smallBold" themeColor="accent">{isWeak ? "Weak" : status}</ThemedText>
                </View>
                <ThemedText type="default">{item.hindiMeaning}</ThemedText>
                {item.mnemonic ? <ThemedText type="small" themeColor="textSecondary">💡 {item.mnemonic}</ThemedText> : null}
                {item.example ? <ThemedText type="small" themeColor="textSecondary">“{item.example}”</ThemedText> : null}
                <View style={styles.actionRow}>
                  <Pressable onPress={() => markLearned(item)} style={[styles.action, { backgroundColor: "#22C55E" }]}>
                    <ThemedText type="smallBold">✓ Learned</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => markPending(item)} style={[styles.action, { backgroundColor: "#F97316" }]}>
                    <ThemedText type="smallBold">↻ Review</ThemedText>
                  </Pressable>
                  {isWeak ? <Pressable onPress={() => clearWeakWord(item.id)} style={[styles.action, { backgroundColor: theme.backgroundElement }]}><ThemedText type="smallBold">Clear weak flag</ThemedText></Pressable> : null}
                </View>
              </View>
            );
          })}

          <View style={[styles.historyCard, { backgroundColor: theme.surface }]}>
            <ThemedText type="subtitle">Recent quiz history</ThemedText>
            {latestHistory.length ? latestHistory.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="smallBold">{item.mode || "Quiz"}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">{new Date(item.date).toLocaleString()}</ThemedText>
                </View>
                <ThemedText type="smallBold">{item.accuracy}%</ThemedText>
              </View>
            )) : <ThemedText type="small" themeColor="textSecondary">No quiz attempts yet.</ThemedText>}
          </View>

          <Footer />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, safeArea: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three },
  header: { gap: Spacing.two }, description: { lineHeight: 24 },
  summaryCard: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.two },
  summaryRow: { flexDirection: "row", gap: Spacing.three, marginTop: Spacing.two }, summaryMetric: { flex: 1 },
  tabRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  tab: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  emptyCard: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.two },
  card: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.two },
  cardHeader: { flexDirection: "row", gap: Spacing.two },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two, marginTop: Spacing.two },
  action: { borderRadius: Spacing.five, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  historyCard: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.two },
  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(128,128,128,.25)" },
});
