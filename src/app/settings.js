import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const settingsItems = [
  { title: 'Notifications', subtitle: 'Reminders for daily learning' },
  { title: 'Daily goal', subtitle: 'Adjust your target word count' },
  { title: 'Review mode', subtitle: 'Smart spaced repetition' },
  { title: 'Appearance', subtitle: 'Dark mode enabled' },
];

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>      
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Settings</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
              Customize your learning flow, sync progress, and manage your premium study preferences.
            </ThemedText>
          </View>

          {settingsItems.map((item) => (
            <Pressable key={item.title} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>              
              <ThemedText type="smallBold">{item.title}</ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.cardText}>
                {item.subtitle}
              </ThemedText>
            </Pressable>
          ))}

          <View style={[styles.card, { backgroundColor: theme.surface }]}>            
            <ThemedText type="smallBold">App version</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.cardText}>
              Shivam Blackbook 1.0.0
            </ThemedText>
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
  },
  header: {
    gap: Spacing.two,
  },
  description: {
    lineHeight: 24,
  },
  card: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.two,
    backgroundColor: '#14161D',
  },
  cardText: {
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.8,
  },
});
