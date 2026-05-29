import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VocabCard } from '@/components/vocab-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { VOCABULARY } from '@/data/vocabulary';
import { useTheme } from '@/hooks/use-theme';

export default function VocabularyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      VOCABULARY.filter((item) =>
        item.word.toLowerCase().includes(query.toLowerCase()) ||
        item.hindiMeaning.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>      
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.header}>
              <ThemedText type="subtitle">Vocabulary</ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
                Swipe through premium cards, review Hindi meanings, and reinforce memory with mnemonics.
              </ThemedText>
              <TextInput
                style={[styles.searchInput, { backgroundColor: theme.surface, color: theme.text }]}
                placeholder="Search words"
                placeholderTextColor={theme.textSecondary}
                value={query}
                onChangeText={setQuery}
              />
              <Pressable style={[styles.searchButton, { backgroundColor: theme.accent }]} onPress={() => router.push('/search')}>
                <ThemedText type="smallBold">Open search screen</ThemedText>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => <VocabCard item={item} onPress={() => {}} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
          ListEmptyComponent={() => (
            <ThemedText type="default" style={styles.emptyText} themeColor="textSecondary">
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
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  description: {
    lineHeight: 24,
  },
  searchInput: {
    borderRadius: Spacing.five,
    padding: Spacing.three,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: Spacing.five,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  cardList: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.six,
  },
  emptyText: {
    padding: Spacing.four,
    textAlign: 'center',
  },
});
