import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";

const searchableText = (item) => [
  item.word,
  item.hindiMeaning,
  item.meaning,
  item.example,
  item.mnemonic,
  ...(Array.isArray(item.synonyms) ? item.synonyms : [item.synonyms]),
  ...(Array.isArray(item.antonyms) ? item.antonyms : [item.antonyms]),
  item.category,
].filter(Boolean).join(" ").toLowerCase();

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const { items, loading, error } = useVocabularyData();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 100);
    return items.filter((item) => searchableText(item).includes(q));
  }, [items, query]);

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <ThemedText type="subtitle">Search vocabulary</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Search the same live vocabulary dataset used by the Vocabulary and Quiz sections.
          </ThemedText>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            placeholder="Search word, Hindi meaning, example, mnemonic..."
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.metaRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {query.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : `${items.length} words available`}
          </ThemedText>
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <ThemedText type="smallBold" themeColor="accent">Clear</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {loading && items.length === 0 ? (
          <ThemedText type="default" style={styles.stateText} themeColor="textSecondary">
            Loading vocabulary…
          </ThemedText>
        ) : error && items.length === 0 ? (
          <ThemedText type="default" style={styles.stateText} themeColor="textSecondary">
            {error}
          </ThemedText>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id || item.word}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ThemedView style={[styles.card, { backgroundColor: theme.surface }]}>
                <View style={styles.cardHeader}>
                  <ThemedText type="subtitle">{item.word}</ThemedText>
                  <ThemedText type="small" themeColor="accent">{item.category}</ThemedText>
                </View>
                <ThemedText type="default" themeColor="textSecondary">
                  {item.hindiMeaning}
                </ThemedText>
                {item.mnemonic ? (
                  <>
                    <ThemedText type="smallBold" style={styles.label}>Mnemonic</ThemedText>
                    <ThemedText type="default" themeColor="textSecondary">{item.mnemonic}</ThemedText>
                  </>
                ) : null}
                {item.example ? (
                  <>
                    <ThemedText type="smallBold" style={styles.label}>Example</ThemedText>
                    <ThemedText type="default" themeColor="textSecondary">{item.example}</ThemedText>
                  </>
                ) : null}
              </ThemedView>
            )}
            ListFooterComponent={() => <Footer />}
            ListEmptyComponent={() => (
              <ThemedText type="default" style={styles.emptyText} themeColor="textSecondary">
                No vocabulary found. Try another word or Hindi meaning.
              </ThemedText>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  header: { padding: Spacing.four, gap: Spacing.two },
  searchInput: { borderRadius: Spacing.five, padding: Spacing.three, fontSize: 16 },
  metaRow: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  card: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.two },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: Spacing.two },
  label: { marginTop: Spacing.two },
  stateText: { padding: Spacing.four, textAlign: "center" },
  emptyText: { marginTop: Spacing.four, textAlign: "center", padding: Spacing.four },
});
