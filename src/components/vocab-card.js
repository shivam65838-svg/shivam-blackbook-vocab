import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export function VocabCard({ item, status = "New", onLearned, onPending }) {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_evt, gestureState) =>
      Math.abs(gestureState.dx) > 10,
    onPanResponderMove: Animated.event([null, { dx: translateX }], {
      useNativeDriver: false,
    }),
    onPanResponderRelease: (_evt, gestureState) => {
      const direction = gestureState.dx > 0 ? 1 : -1;
      const threshold = 110;
      if (Math.abs(gestureState.dx) > threshold) {
        Animated.timing(translateX, {
          toValue: direction * 500,
          duration: 180,
          useNativeDriver: false,
        }).start(() => {
          translateX.setValue(0);
        });
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  const cardStyle = {
    transform: [{ translateX }],
    backgroundColor: theme.surface,
  };

  const statusColor =
    status === "Learned"
      ? "#10B981"
      : status === "Pending"
        ? "#F59E0B"
        : theme.accent;

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={[theme.accent, "#1F2434"]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.gradient}
      >
        <View style={styles.categoryRow}>
          <ThemedText
            type="smallBold"
            style={styles.category}
            themeColor="text"
          >
            {item.category}
          </ThemedText>
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <ThemedText type="smallBold" style={styles.statusText}>
              {status}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="title" style={styles.word}>
          {item.word}
        </ThemedText>
      </LinearGradient>

      <View style={styles.detailBlock}>
        <ThemedText type="default" themeColor="accent">
          Hindi meaning
        </ThemedText>
        <ThemedText type="subtitle" style={styles.meaning}>
          {item.hindiMeaning}
        </ThemedText>
      </View>

      <View style={styles.detailBlock}>
        <ThemedText type="default" themeColor="accent">
          Mnemonic
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          {item.mnemonic}
        </ThemedText>
      </View>

      <View style={styles.detailBlock}>
        <ThemedText type="default" themeColor="accent">
          Example
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          {item.example}
        </ThemedText>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onLearned}
          style={[styles.actionButton, { backgroundColor: theme.accent }]}
        >
          <ThemedText type="smallBold">✓ Learned</ThemedText>
        </Pressable>
        <Pressable
          onPress={onPending}
          style={[
            styles.actionButton,
            { backgroundColor: theme.backgroundElement },
          ]}
        >
          <ThemedText type="smallBold">📖 Pending Revision</ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: Spacing.five,
    padding: Spacing.four,
    marginRight: 0,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  gradient: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  category: {
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  statusText: {
    color: "#FFFFFF",
  },
  word: {
    fontSize: 42,
    lineHeight: 48,
  },
  detailBlock: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  meaning: {
    fontSize: 24,
    lineHeight: 30,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
});
