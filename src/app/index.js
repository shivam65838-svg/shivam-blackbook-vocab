import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DailyTargetCard } from "@/components/daily-target-card";
import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabProgress } from "@/hooks/use-vocab-progress";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";

const quickActions = [
  { label: "Vocabulary", route: "/vocabulary" },
  { label: "Quiz", route: "/quiz" },
  { label: "Revision", route: "/revision" },
  { label: "Search", route: "/search" },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { items: vocabulary, loading, error } = useVocabularyData();
  const {
    dailyTarget,
    completedToday,
    remainingToday,
    setDailyTarget,
    learnedCount,
    pendingCount,
    weakCount,
    currentStreak,
    longestStreak,
    weakIds,
  } = useVocabProgress();

  const wordOfDay = useMemo(() => {
    if (!vocabulary.length) return null;
    const start = new Date(2020, 0, 1);
    const today = new Date();
    const day = Math.floor((today - start) / 86400000);
    return vocabulary[Math.abs(day) % vocabulary.length];
  }, [vocabulary]);

  const weakPreview = useMemo(
    () => vocabulary.filter((item) => weakIds.has(item.id)).slice(0, 3),
    [vocabulary, weakIds]
  );

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={["#111827", "#10132C"]} style={styles.heroPanel}>
            <Image source={require("../../assets/logo.png.jpeg")} style={styles.heroLogo} />
            <ThemedText type="small" themeColor="textSecondary">SK Vocabulary</ThemedText>
            <ThemedText type="title" style={styles.heroTitle}>Build a stronger vocabulary every day</ThemedText>
            <ThemedText type="default" style={styles.heroSubtitle} themeColor="textSecondary">
              Learn, revise and test your English vocabulary with all personal progress stored locally in your browser.
            </ThemedText>
            <View style={styles.statsRow}>
              {[
                ["Total words", vocabulary.length, "/vocabulary"],
                ["Learned", learnedCount, "/vocabulary?filter=learned"],
                ["Pending", pendingCount, "/vocabulary?filter=pending"],
                ["Weak", weakCount, "/revision"],
              ].map(([label, value, route]) => (
                <Pressable key={label} onPress={() => router.push(route)} style={[styles.statCard, { backgroundColor: theme.surface }]}>
                  <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
                  <ThemedText type="subtitle">{value}</ThemedText>
                </Pressable>
              ))}
            </View>
          </LinearGradient>

          <View style={styles.streakRow}>
            <View style={[styles.streakCard, { backgroundColor: theme.surface }]}>
              <ThemedText type="small" themeColor="textSecondary">Current streak</ThemedText>
              <ThemedText type="title">🔥 {currentStreak} day{currentStreak === 1 ? "" : "s"}</ThemedText>
            </View>
            <View style={[styles.streakCard, { backgroundColor: theme.surface }]}>
              <ThemedText type="small" themeColor="textSecondary">Longest streak</ThemedText>
              <ThemedText type="title">🏆 {longestStreak} day{longestStreak === 1 ? "" : "s"}</ThemedText>
            </View>
          </View>

          <DailyTargetCard
            totalWords={vocabulary.length}
            learnedWords={learnedCount}
            pendingWords={pendingCount}
            dailyTarget={dailyTarget}
            completedToday={completedToday}
            remainingToday={remainingToday}
            setDailyTarget={setDailyTarget}
          />

          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">Word of the day</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">A fresh word is selected automatically each day.</ThemedText>
            </View>
            <View style={styles.badge}><ThemedText type="smallBold" themeColor="accent">Daily</ThemedText></View>
          </View>

          <View style={[styles.wordCard, { backgroundColor: theme.surface }]}>
            {wordOfDay ? (
              <>
                <ThemedText type="smallBold" themeColor="accent">{wordOfDay.category}</ThemedText>
                <ThemedText type="title" style={styles.word}>{wordOfDay.word}</ThemedText>
                <ThemedText type="subtitle">{wordOfDay.hindiMeaning}</ThemedText>
                {wordOfDay.mnemonic ? <ThemedText type="default" themeColor="textSecondary">💡 {wordOfDay.mnemonic}</ThemedText> : null}
                {wordOfDay.example ? <ThemedText type="default" themeColor="textSecondary">“{wordOfDay.example}”</ThemedText> : null}
                <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={() => router.push(`/vocabulary?word=${encodeURIComponent(wordOfDay.word)}`)}>
                  <ThemedText type="smallBold">Learn this word</ThemedText>
                </Pressable>
              </>
            ) : (
              <ThemedText themeColor="textSecondary">{loading ? "Loading today’s word…" : "No vocabulary available."}</ThemedText>
            )}
          </View>

          <View style={[styles.weakCard, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText type="subtitle">Weak words</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">Words you recently missed in quizzes.</ThemedText>
              </View>
              <Pressable onPress={() => router.push("/revision")}><ThemedText type="smallBold" themeColor="accent">Practice</ThemedText></Pressable>
            </View>
            {weakPreview.length ? weakPreview.map((item) => (
              <View key={item.id} style={styles.weakRow}>
                <ThemedText type="smallBold">{item.word}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{item.hindiMeaning}</ThemedText>
              </View>
            )) : <ThemedText type="small" themeColor="textSecondary">No weak words yet. Take a quiz to build your practice list.</ThemedText>}
          </View>

          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <Pressable key={action.label} style={({ pressed }) => [styles.actionCard, pressed && styles.actionPressed]} onPress={() => router.push(action.route)}>
                <ThemedText type="smallBold" style={{ color: "#FFFFFF" }}>{action.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <Footer />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, safeArea: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.four },
  heroPanel: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.three, alignItems: "center" },
  heroLogo: { width: 60, height: 60, borderRadius: Spacing.three },
  heroTitle: { fontSize: 28, lineHeight: 36, textAlign: "center" }, heroSubtitle: { lineHeight: 24, textAlign: "center" },
  statsRow: { flexDirection: "row", gap: Spacing.two, flexWrap: "wrap", width: "100%" },
  statCard: { flex: 1, minWidth: 100, borderRadius: Spacing.five, padding: Spacing.three },
  streakRow: { flexDirection: "row", gap: Spacing.three },
  streakCard: { flex: 1, borderRadius: Spacing.five, padding: Spacing.three, gap: Spacing.one },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  badge: { borderRadius: 999, backgroundColor: "#161B2F", paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  wordCard: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.two },
  word: { fontSize: 34, lineHeight: 40 },
  primaryButton: { alignSelf: "flex-start", borderRadius: Spacing.five, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, marginTop: Spacing.two },
  weakCard: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.three },
  weakRow: { paddingVertical: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(128,128,128,.25)" },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.three },
  actionCard: { flex: 1, minWidth: "48%", borderRadius: Spacing.five, padding: Spacing.three, alignItems: "center", justifyContent: "center", backgroundColor: "#131625" },
  actionPressed: { opacity: 0.75 },
});
