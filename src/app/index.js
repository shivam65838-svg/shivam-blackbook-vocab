import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DailyTargetCard } from "@/components/daily-target-card";
import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabProgress } from "@/hooks/use-vocab-progress";

const quickActions = [
  { label: "Vocabulary", route: "/vocabulary" },
  { label: "Quiz", route: "/quiz" },
  { label: "Revision", route: "/revision" },
  { label: "Search", route: "/search" },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
const {
  dailyTarget,
  completedToday,
  remainingToday,
  setDailyTarget,
  learnedIds,
  pendingIds,
} = useVocabProgress();
const [realTotalWords, setRealTotalWords] = useState(0);
const [words, setWords] = useState([]);
const learnedCount = learnedIds.length;
const pendingCount = pendingIds.length;

const loadWords = useCallback(async () => {
  try {
    const response = await fetch(
      "https://vocab-api-seven.vercel.app/api/vocabulary"
    );

    const data = await response.json();

    setWords(data);
    setRealTotalWords(data.length);
  } catch (error) {
    console.error(error);
  }
}, []);

useEffect(() => {
  loadWords();
}, [loadWords]);



  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <LinearGradient
            colors={["#111827", "#10132C"]}
            style={styles.heroPanel}
          >
            <Image
              source={require("../../assets/logo.png.jpeg")}
              style={styles.heroLogo}
            />
            <View style={styles.heroHeader}>
              <ThemedText type="small" themeColor="textSecondary">
                Shivam Blackbook
              </ThemedText>
              <ThemedText type="title" style={styles.heroTitle}>
                Build premium vocabulary habits
              </ThemedText>
            </View>
            <ThemedText
              type="default"
              style={styles.heroSubtitle}
              themeColor="textSecondary"
            >
              Track your streak, review flashcards, and strengthen Hindi-English
              recall every day.
              </ThemedText>

            
              <View style={styles.statsRow}>
  <Pressable
  onPress={() => router.push("/vocabulary")}
    style={[styles.statCard, { backgroundColor: theme.surface }]}
  >
    <ThemedText type="small" themeColor="textSecondary">
      Total words
    </ThemedText>
    <ThemedText type="subtitle"> {realTotalWords}</ThemedText>
  </Pressable>

<Pressable
  onPress={() => router.push("/vocabulary?filter=learned")}
  style={[styles.statCard, { backgroundColor: theme.surface }]}
>
  <ThemedText type="small" themeColor="textSecondary">
    Learned
  </ThemedText>
  <ThemedText type="subtitle">{learnedCount}</ThemedText>
</Pressable>

  <Pressable
  onPress={() => router.push("/vocabulary?filter=pending")}
  style={[styles.statCard, { backgroundColor: theme.surface }]}
>
  <ThemedText type="small" themeColor="textSecondary">
    Pending
  </ThemedText>
  <ThemedText type="subtitle">{pendingCount}</ThemedText>
</Pressable>
</View>
            
          </LinearGradient>

          <DailyTargetCard
  totalWords={realTotalWords}
  learnedWords={learnedCount}
  pendingWords={pendingCount}
            dailyTarget={dailyTarget}
            completedToday={completedToday}
            remainingToday={remainingToday}
             setDailyTarget={setDailyTarget}
          />

          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle">Today's focus</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Swipe through smart flashcards and strengthen rapid recall.
              </ThemedText>
            </View>
            <View style={styles.badge}>
              <ThemedText type="smallBold" themeColor="accent">
                Progress-driven
              </ThemedText>
            </View>
          </View>

          <View style={[styles.flashcard, { backgroundColor: theme.surface }]}>
            <Image
              source={require("../../assets/images/tabIcons/home.png")}
              style={styles.flashcardIcon}
            />
            <View style={styles.flashcardText}>
              <ThemedText type="smallBold">Word of the day</ThemedText>
              <ThemedText type="subtitle" style={styles.flashcardWord}>
                Serendipity
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                A happy accident or pleasant surprise that helps you discover
                new meaning.
              </ThemedText>
            </View>
          </View>

          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && styles.actionPressed,
                ]}
                onPress={() => router.push(action.route)}
              >
                <ThemedText
  type="smallBold"
  style={{ color: "#FFFFFF" }}
>
  {action.label}
</ThemedText>
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
    alignItems: "stretch",
  },
  heroPanel: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: "center",
     width: "100%",
  },
  heroLogo: {
    width: 60,
    height: 60,
    borderRadius: Spacing.three,
  },
  heroHeader: {
    gap: Spacing.one,
  },
  heroTitle: {
    fontSize: 26,
    lineHeight: 34,
    textAlign: "center",
  },
  heroSubtitle: {
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.three,
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: 92,
    borderRadius: Spacing.five,
    padding: Spacing.three,
  },
  sectionHeader: {
    flexDirection: "column",
    
    alignItems: "flex-start",
    gap: Spacing.two,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: "#161B2F",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  flashcard: {
    borderRadius: Spacing.five,
    flexDirection: "column",
    padding: Spacing.four,
    gap: Spacing.four,
     alignItems: "center",
  },
  flashcardIcon: {
    width: 64,
    height: 64,
    tintColor: "#6F8CFF",
  },
  flashcardText: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.one,
  },
  flashcardWord: {
    fontSize: 26,
    lineHeight: 34,
  },
  quickActions: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: Spacing.three,
  },
  actionCard: {
    flex: 1,
    minWidth: "48%",
    borderRadius: Spacing.five,
    padding: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#131625",
  },
  actionPressed: {
    opacity: 0.75,
  },
});
