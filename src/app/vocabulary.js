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
  const { filter } = useLocalSearchParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const {
  items: vocabulary,
  setItems,
  categories: CATEGORIES,
} = useVocabularyData();
  const {
  getStatus,
  markLearned,
  markPending,
} = useVocabProgress();

  const filtered = useMemo(() => {
    
    const q = (query || "").trim().toLowerCase();

    return vocabulary.filter((rawItem) => {
  

if (filter === "learned" && rawItem.status !== "Learned") {
  return false;
}

if (filter === "pending" && rawItem.status === "Learned") {
  return false;
}

const item = { ...rawItem };
      const itemCategory =
        item.category && typeof item.category === "string"
          ? item.category
          : "Words";

      if (category !== "All" && itemCategory !== category) {
        return false;
      }

      if (!q) {
        return true;
      }

      const word = (item.word || "").toString().toLowerCase();
      const hindi = (item.hindiMeaning || "").toString().toLowerCase();
      const meaning = (item.meaning || "").toString().toLowerCase();
      const example = (item.example || "").toString().toLowerCase();

      const synonyms = Array.isArray(item.synonyms)
        ? item.synonyms.join(" ").toLowerCase()
        : (item.synonyms || "").toString().toLowerCase();
      const antonyms = Array.isArray(item.antonyms)
        ? item.antonyms.join(" ").toLowerCase()
        : (item.antonyms || "").toString().toLowerCase();

      return (
        word.includes(q) ||
        hindi.includes(q) ||
        meaning.includes(q) ||
        example.includes(q) ||
        synonyms.includes(q) ||
        antonyms.includes(q)
      );
    });
  }, [query, category, filter, vocabulary]);
  const getCategoryCount = (categoryName) => {
  if (categoryName === "All") {
    return vocabulary.length;
  }

  return vocabulary.filter(
    (item) => item.category === categoryName
  ).length;
};

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable
  onPress={() => router.replace("/")}
  style={({ pressed }) => [
    {
      backgroundColor: pressed ? "#cc0000" : "red",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignSelf: "flex-start",
      marginBottom: 10,
    },
  ]}
>
  <ThemedText
    type="smallBold"
    style={{ color: "#fff" }}
  >
    ← Home
  </ThemedText>
</Pressable>
      <ThemedText type="subtitle">
  {filter === "learned"
    ? "Learned Words"
    : filter === "pending"
    ? "Pending Words"
    : "Vocabulary"}
</ThemedText>
      <ThemedText
        type="default"
        themeColor="textSecondary"
        style={styles.description}
      >
        Swipe through premium cards, review Hindi meanings, and reinforce memory
        with mnemonics.
      </ThemedText>

      <View style={styles.searchRow}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: theme.surface, color: theme.text },
          ]}
          placeholder="Search words"
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          accessibilityLabel="Search vocabulary"
        />
        <Pressable
          style={[styles.searchButton, { backgroundColor: theme.accent }]}
          onPress={() => router.push("/search")}
          accessibilityLabel="Open search screen"
        >
          <ThemedText type="smallBold">Open search screen</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
        accessibilityRole="toolbar"
      >
        {CATEGORIES.map((cat) => {
          const selected = cat === category;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selected ? theme.accent : "transparent",
                  borderColor: selected ? theme.accent : theme.textSecondary,
                },
              ]}
              accessibilityState={{ selected }}
            >
              <ThemedText
  type={selected ? "smallBold" : "default"}
  style={selected ? styles.filterTextSelected : styles.filterText}
>
  {cat} ({getCategoryCount(cat)})
</ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => (item.id ? item.id.toString() : item.word)}
          ListHeaderComponent={renderHeader()}
          renderItem={({ item, index }) => (
  <View style={styles.listItem}>
    <ThemedText
      type="smallBold"
      style={{
        marginBottom: 8,
        fontSize: 16,
      }}
    >
      {index + 1}.
    </ThemedText>

    <VocabCard
      item={{ ...item, category: item.category ?? "Words" }}
      status={getStatus(item)}
      onLearned={async () => {
        await markLearned(item);

        setItems((prev) =>
          prev.map((w) =>
            w.id === item.id
              ? { ...w, status: "Learned" }
              : w
          )
        );
      }}
      onPending={async () => {
        await markPending(item);

        setItems((prev) =>
          prev.map((w) =>
            w.id === item.id
              ? { ...w, status: "Pending" }
              : w
          )
        );
      }}
    />
  </View>
)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
          ListFooterComponent={() => <Footer />}
          ListEmptyComponent={() => (
            <ThemedText
              type="default"
              style={styles.emptyText}
              themeColor="textSecondary"
            >
              No words found.
            </ThemedText>
          )}
        />
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
  backButton: {
  alignSelf: "flex-start",
  paddingVertical: 8,
  paddingHorizontal: 12,
  marginBottom: 10,
},
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  description: {
    lineHeight: 24,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    borderRadius: Spacing.five,
    padding: Spacing.three,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    marginLeft: Spacing.two,
  },
  filterBar: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
  },
  filterButton: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginRight: Spacing.two,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
  },
  filterTextSelected: {
    fontSize: 14,
    color: "#fff",
  },
  cardList: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
    paddingTop: Spacing.two,
  },
  listItem: {
    marginBottom: Spacing.three,
  },
  emptyText: {
    padding: Spacing.four,
    textAlign: "center",
  },
});
