import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DailyTargetCard } from '@/components/daily-target-card';
import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const quickActions = [
  { label: 'Vocabulary', route: '/vocabulary' },
  { label: 'Quiz', route: '/quiz' },
  { label: 'Revision', route: '/revision' },
  { label: 'Search', route: '/search' },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#111827', '#10132C']} style={styles.heroPanel}>
            <View style={styles.heroHeader}>
              <ThemedText type="small" themeColor="textSecondary">
                Shivam Blackbook
              </ThemedText>
              <ThemedText type="title" style={styles.heroTitle}>
                Build premium vocabulary habits
              </ThemedText>
            </View>
            <ThemedText type="default" style={styles.heroSubtitle} themeColor="textSecondary">
              Track your streak, review flashcards, and strengthen Hindi-English recall every day.
            </ThemedText>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>                
                <ThemedText type="small" themeColor="textSecondary">
                  Streak
                </ThemedText>
                <ThemedText type="subtitle">7 days</ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>                
                <ThemedText type="small" themeColor="textSecondary">
                  Word goal
                </ThemedText>
                <ThemedText type="subtitle">24/30</ThemedText>
              </View>
            </View>
          </LinearGradient>

          <DailyTargetCard wordsLearned={24} goal={30} streak={7} />

          <View style={styles.sectionHeader}>
            <View>
              <ThemedText type="subtitle">Today's focus</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                Swipe through smart flashcards and strengthen rapid recall.
              </ThemedText>
            </View>
            <View style={styles.badge}>              
              <ThemedText type="smallBold" themeColor="accent">
                +30% recall
              </ThemedText>
            </View>
          </View>

          <View style={[styles.flashcard, { backgroundColor: theme.surface }]}>            
            <Image
              source={require('../../assets/images/tabIcons/home.png')}
              style={styles.flashcardIcon}
            />
            <View style={styles.flashcardText}>
              <ThemedText type="smallBold">Word of the day</ThemedText>
              <ThemedText type="subtitle" style={styles.flashcardWord}>
                Serendipity
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                A happy accident or pleasant surprise that helps you discover new meaning.
              </ThemedText>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <ThemedText type="subtitle">Weekly progress</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Learn 6 more words to finish today
              </ThemedText>
            </View>
            <ProgressBar value={0.76} />
          </View>

          <View style={styles.quickActions}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.actionCard, pressed && styles.actionPressed]}
                onPress={() => router.push(action.route)}
              >
                <ThemedText type="smallBold">{action.label}</ThemedText>
              </Pressable>
            ))}
          </View>
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
    alignItems: 'stretch',
  },
  heroPanel: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroHeader: {
    gap: Spacing.one,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 42,
  },
  heroSubtitle: {
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    borderRadius: Spacing.five,
    padding: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  badge: {
    borderRadius: 999,
    backgroundColor: '#161B2F',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  flashcard: {
    borderRadius: Spacing.five,
    flexDirection: 'row',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  flashcardIcon: {
    width: 64,
    height: 64,
    tintColor: '#6F8CFF',
  },
  flashcardText: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.one,
  },
  flashcardWord: {
    fontSize: 26,
    lineHeight: 34,
  },
  progressSection: {
    gap: Spacing.two,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actionCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: Spacing.five,
    padding: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131625',
  },
  actionPressed: {
    opacity: 0.75,
  },
});
