import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function ProgressBar({ value = 0 }) {
  const theme = useTheme();
  const progress = Math.min(Math.max(value, 0), 1);

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>      
      <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
