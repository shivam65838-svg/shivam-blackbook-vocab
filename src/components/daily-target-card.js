import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function DailyTargetCard({ wordsLearned = 24, goal = 30, streak = 5 }) {
  const theme = useTheme();
  const completion = Math.min(Math.max(wordsLearned / goal, 0), 1);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.surface }]}>      
      <View style={styles.topRow}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Daily target
          </ThemedText>
          <ThemedText type="subtitle">{wordsLearned}/{goal} words</ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>          
          <ThemedText type="smallBold" themeColor="accent">{streak} day streak</ThemedText>
        </View>
      </View>

      <ProgressBar value={completion} />

      <View style={styles.bottomRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Keep the streak alive by learning at least 6 more words today.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  bottomRow: {
    marginTop: Spacing.three,
  },
});
