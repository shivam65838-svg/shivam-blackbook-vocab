import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { VocabCard } from "@/components/vocab-card";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabProgress } from "@/hooks/use-vocab-progress";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";

export default function VocabularyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { filter, word } = useLocalSearchParams();
  const [query, setQuery] = useState(() => (typeof word === "string" ? word : ""));
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [dismissedIds, setDismissedIds] = useState([]);
  const { items: vocabulary, categories: CATEGORIES, loading, error } = useVocabularyData();
  const { getStatus, markLearned, markPending } = useVocabProgress();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vocabulary.filter((item) => {
      if (dismissedIds.includes(item.id)) return false;
      const status = getStatus(item);
      if (filter === "learned" && status !== "Learned") return false;
      if (filter === "pending" && status !== "Pending") return false;
      if (category !== "All" && item.category !== category) return false;
      if (difficulty !== "All" && item.difficulty !== difficulty) return false;
      if (!q) return true;
      const haystack = [
        item.word,
        item.hindiMeaning,
        item.meaning,
        item.example,
        item.mnemonic,
        item.category,
        ...(Array.isArray(item.synonyms) ? item.synonyms : [item.synonyms]),
        ...(Array.isArray(item.antonyms) ? item.antonyms : [item.antonyms]),
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [category, difficulty, dismissedIds, filter, getStatus, query, vocabulary]);

  const getCategoryCount = (categoryName) =>
    categoryName === "All"
      ? vocabulary.length
      : vocabulary.filter((item) => item.category === categoryName).length;

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.replace("/")}
        style={({ pressed }) => [styles.homeButton, { backgroundColor: pressed ? "#B91C1C" : "#DC2626" }]}
      >
        <ThemedText type="smallBold" style={{ color: "#fff" }}>← Home</ThemedText>
      </Pressable>

      <ThemedText type="subtitle">
        {filter === "learned" ? "Learned Words" : filter === "pending" ? "Pending Words" : "Vocabulary"}
      </ThemedText>
      <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
        Swipe right to mark a word learned, swipe left to send it to revision.
      </ThemedText>

      <View style={styles.searchRow}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.surface, color: theme.text }]}
          placeholder="Search word, Hindi meaning, example..."
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          accessibilityLabel="Search vocabulary"
        />
        <Pressable
          style={[styles.searchButton, { backgroundColor: theme.accent }]}
          onPress={() => router.push("/search")}
        >
          <ThemedText type="smallBold">Search</ThemedText>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {CATEGORIES.map((cat) => {
          const selected = cat === category;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.filterButton, { backgroundColor: selected ? theme.accent : "transparent", borderColor: selected ? theme.accent : theme.textSecondary }]}
            >
              <ThemedText type={selected ? "smallBold" : "default"} style={selected ? styles.filterTextSelected : styles.filterText}>
                {cat} ({getCategoryCount(cat)})
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
        {["All", "Easy", "Medium", "Hard"].map((level) => {
          const selected = difficulty === level;
          return (
            <Pressable
              key={level}
              onPress={() => setDifficulty(level)}
              style={[styles.smallFilter, { backgroundColor: selected ? theme.backgroundSelected : theme.surface }]}
            >
              <ThemedText type={selected ? "smallBold" : "small"}>{level}</ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.resultRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {filtered.length} matching word{filtered.length === 1 ? "" : "s"}
        </ThemedText>
        {(query || difficulty !== "All" || category !== "All" || dismissedIds.length) ? (
          <Pressable onPress={() => { setQuery(""); setDifficulty("All"); setCategory("All"); setDismissedIds([]); }}>
            <ThemedText type="smallBold" themeColor="accent">Clear filters</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id || item.word}
          ListHeaderComponent={renderHeader}
          renderItem={({ item, index }) => (
            <View style={styles.listItem}>
              <ThemedText type="smallBold" style={styles.number}>{index + 1}.</ThemedText>
              <VocabCard
                item={item}
                status={getStatus(item)}
                onLearned={() => markLearned(item)}
                onPending={() => markPending(item)}
                onSwiped={(direction) => {
                  if (direction === "right") markLearned(item);
                  else markPending(item);
                  setDismissedIds((current) => [...new Set([...current, item.id])]);
                }}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
          ListFooterComponent={() => <Footer />}
          ListEmptyComponent={() => (
            <ThemedText type="default" style={styles.emptyText} themeColor="textSecondary">
              {loading ? "Loading vocabulary…" : error && vocabulary.length === 0 ? error : "No words match these filters."}
            </ThemedText>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: Spacing.three, gap: Spacing.three },
  homeButton: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, alignSelf: "flex-start" },
  description: { lineHeight: 24 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  searchInput: { flex: 1, borderRadius: Spacing.five, padding: Spacing.three, fontSize: 16 },
  searchButton: { borderRadius: Spacing.five, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, alignItems: "center" },
  filterBar: { paddingVertical: Spacing.two, alignItems: "center" },
  filterButton: { borderRadius: 999, paddingVertical: Spacing.two, paddingHorizontal: Spacing.four, marginRight: Spacing.two, borderWidth: 1 },
  filterText: { fontSize: 14 },
  filterTextSelected: { fontSize: 14, color: "#fff" },
  smallFilter: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardList: { paddingHorizontal: Spacing.four, paddingBottom: BottomTabInset + Spacing.six, paddingTop: Spacing.two },
  listItem: { marginBottom: Spacing.three },
  number: { marginBottom: 8, fontSize: 16 },
  emptyText: { padding: Spacing.four, textAlign: "center" },
});
