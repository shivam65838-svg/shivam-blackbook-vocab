import React from "react";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { VOCABULARY } from "@/data/vocabulary";
import { useTheme } from "@/hooks/use-theme";

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = React.useState("");
  console.log("SEARCH =", query);
  const results = VOCABULARY.filter(
    (item) =>
      item.word.toLowerCase().includes(query.toLowerCase()) ||
      item.hindiMeaning.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <ThemedText type="subtitle">Search vocabulary</ThemedText>
          <TextInput
            style={[
              styles.searchInput,
              { backgroundColor: theme.backgroundElement, color: theme.text },
            ]}
            placeholder="Search word or Hindi meaning"
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ThemedView
              style={[styles.card, { backgroundColor: theme.surface }]}
            >
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle">{item.word}</ThemedText>
                <ThemedText type="small" themeColor="accent">
                  {item.category}
                </ThemedText>
              </View>
              <ThemedText type="default" themeColor="textSecondary">
                {item.hindiMeaning}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.label}>
                Mnemonic
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                {item.mnemonic}
              </ThemedText>
            </ThemedView>
          )}
          ListFooterComponent={() => <Footer />}
          ListEmptyComponent={() => (
            <ThemedText
              type="default"
              style={styles.emptyText}
              themeColor="textSecondary"
            >
              No vocabulary found.
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
  header: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  searchInput: {
    borderRadius: Spacing.five,
    padding: Spacing.three,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  card: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  label: {
    marginTop: Spacing.two,
  },
  emptyText: {
    marginTop: Spacing.four,
    textAlign: "center",
  },
});
