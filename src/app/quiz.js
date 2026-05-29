import { useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { VOCABULARY } from "@/data/vocabulary";
import { useTheme } from "@/hooks/use-theme";

const getOptions = (word, vocabulary) => {
  const wrongAnswers = vocabulary
    .filter((item) => item.word !== word.word)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map((item) => item.hindiMeaning);
  return [...wrongAnswers, word.hindiMeaning].sort(() => 0.5 - Math.random());
};

export default function QuizScreen() {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");

  const questionData = VOCABULARY[currentIndex];
  const options = useMemo(
    () => getOptions(questionData, VOCABULARY),
    [currentIndex, questionData],
  );

  const handleSelect = (option) => {
    setSelected(option);
    setFeedback(
      option === questionData.hindiMeaning
        ? "Correct! Keep going."
        : "Try again — focus on the meaning.",
    );
  };

  const handleNext = () => {
    setSelected(null);
    setFeedback("");
    setCurrentIndex((prev) => (prev + 1) % VOCABULARY.length);
  };

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <ThemedText type="subtitle">Quiz</ThemedText>
            <ThemedText
              type="default"
              themeColor="textSecondary"
              style={styles.description}
            >
              Test your recall with premium multiple-choice questions and
              sharpen the meaning instantly.
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold">
              What is the Hindi meaning of
            </ThemedText>
            <ThemedText type="title" style={styles.question}>
              {questionData.word}
            </ThemedText>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isSelected = selected === item;
              const isCorrect = item === questionData.hindiMeaning;
              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: isSelected
                        ? isCorrect
                          ? "#1F6B3C"
                          : "#5C2230"
                        : theme.surface,
                    },
                    pressed && styles.optionPressed,
                  ]}
                >
                  <ThemedText
                    type="default"
                    themeColor={isSelected ? "text" : "textSecondary"}
                  >
                    {item}
                  </ThemedText>
                </Pressable>
              );
            }}
          />

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              {feedback || "Choose the correct answer to continue your streak."}
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                pressed && styles.actionPressed,
              ]}
              onPress={handleNext}
            >
              <ThemedText type="smallBold">Next question</ThemedText>
            </Pressable>
          </View>

          <Footer />
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
    gap: Spacing.three,
  },
  question: {
    marginTop: Spacing.two,
    fontSize: 28,
    lineHeight: 34,
  },
  option: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    marginBottom: Spacing.two,
  },
  optionPressed: {
    opacity: 0.8,
  },
  footer: {
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  nextButton: {
    borderRadius: Spacing.five,
    padding: Spacing.three,
    backgroundColor: "#1A3CBF",
    alignItems: "center",
  },
});
