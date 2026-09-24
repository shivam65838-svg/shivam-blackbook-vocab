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

export function VocabCard({ item, status = "New", onLearned, onPending, onSwiped }) {
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
          onSwiped?.(direction > 0 ? "right" : "left");
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
        const isLearned = status === "Learned";
const isPending =
  status === "Pending" ||
  status === "Pending Revision";

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={["#22D3EE", "#2563EB", "#312E81"]}
        start={[0, 0]}
        end={[1, 0]}
        style={styles.gradient}
      >
        <View style={styles.categoryRow}>
          <ThemedText
            type="smallBold"
            style={styles.category}
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
        <View style={styles.wordUnderline} />
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
  style={[
    styles.actionButton,
    {
      backgroundColor: isLearned
        ? "#22C55E"
        : "#E5E7EB",
    },
  ]}
>
  <ThemedText
    type="smallBold"
    style={{
      color: isLearned ? "#FFFFFF" : "#000000",
    }}
  >
    {isLearned ? "✓ Learned" : "Mark as Learned"}
  </ThemedText>
</Pressable>
        <Pressable
  onPress={onPending}
  style={[
    styles.actionButton,
    {
      backgroundColor: isPending
        ? "#F97316"
        : theme.backgroundElement,
    },
  ]}
>
  <ThemedText
    type="smallBold"
    style={{
      color: isPending ? "#FFFFFF" : undefined,
    }}
  >
    📖 Pending Revision
  </ThemedText>
</Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    marginRight: 0,
    shadowColor: "#102A72",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
    backgroundColor: "#FFFFFF",
  },
  gradient: {
    minHeight: 190,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
    justifyContent: "space-between",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.two,
  },
  category: {
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.84)",
    letterSpacing: 0,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: "rgba(15,23,42,0.32)",
  },
  statusText: {
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  word: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "800",
    lineHeight: 54,
    letterSpacing: 0,
    maxWidth: "100%",
  },
  wordUnderline: {
    width: 54,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  detailBlock: {
    gap: Spacing.one,
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
  },
  meaning: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.two,
    padding: Spacing.four,
    paddingTop: Spacing.two,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: Spacing.two,
    alignItems: "center",
  },
});
