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
import { useTheme } from "@/hooks/use-theme";
import { useVocabProgress } from "@/hooks/use-vocab-progress";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";
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
  const [answers, setAnswers] = useState([]);
const [showResult, setShowResult] = useState(false);
const [reviewFilter, setReviewFilter] = useState("all");
 const [quizLimit, setQuizLimit] = useState(10);

  const { items: vocabulary } = useVocabularyData();
  const { learnedIds } = useVocabProgress();

const quizWords = vocabulary.filter((item) =>
  learnedIds.includes(item.id?.toString() || item.word)
);

const shuffledWords = useMemo(() => {
  return [...quizWords].sort(() => Math.random() - 0.5);
}, [quizWords]);
const limitedWords = shuffledWords.slice(
  0,
  Math.min(quizLimit, shuffledWords.length)
);

const questionData =
  limitedWords.length > 0
    ? limitedWords[currentIndex]
    : null;

const options = useMemo(() => {
  if (!questionData) return [];
  return getOptions(questionData, quizWords);
}, [currentIndex, questionData, quizWords]);

const handleSelect = (option) => {
  setSelected(option);
};

const handleNext = () => {
  if (!selected) return;

  setAnswers((prev) => [
    ...prev,
    {
      word: questionData.word,
      correct: questionData.hindiMeaning,
      selected,
      isCorrect: selected === questionData.hindiMeaning,
    },
  ]);

  setSelected(null);

  if (currentIndex >= limitedWords.length - 1) {
    setShowResult(true);
    return;
  }

 setCurrentIndex((prev) => prev + 1);
};
if (showResult) {
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const wrongAnswers = answers.length - correctAnswers;
  const accuracy =
    answers.length > 0
      ? Math.round((correctAnswers / answers.length) * 100)
      : 0;

  return (
    <ScrollView>
      <ThemedView style={styles.page}>
        <ThemedText type="title">
          Quiz Result
        </ThemedText>

        <ThemedText type="subtitle">
          Score: {correctAnswers}/{answers.length}
        </ThemedText>

        <ThemedText type="subtitle">
          Correct: {correctAnswers}
        </ThemedText>

        <ThemedText type="subtitle">
          Wrong: {wrongAnswers}
        </ThemedText>

        <ThemedText type="subtitle">
          Accuracy: {accuracy}%
        </ThemedText>

        <View
          style={{
            flexDirection: "row",
            gap: 10,
            marginTop: 20,
          }}
        >
          <Pressable
            style={styles.nextButton}
            onPress={() => setReviewFilter("all")}
          >
            <ThemedText>All</ThemedText>
          </Pressable>

          <Pressable
            style={styles.nextButton}
            onPress={() => setReviewFilter("correct")}
          >
            <ThemedText>Correct</ThemedText>
          </Pressable>

          <Pressable
            style={styles.nextButton}
            onPress={() => setReviewFilter("wrong")}
          >
            <ThemedText>Wrong</ThemedText>
          </Pressable>
        </View>

        {answers
          .filter((item) => {
            if (reviewFilter === "correct") return item.isCorrect;
            if (reviewFilter === "wrong") return !item.isCorrect;
            return true;
          })
          .map((item, index) => (
            <View
              key={index}
              style={{
                marginTop: 10,
                padding: 12,
                borderRadius: 10,
                backgroundColor: item.isCorrect
                  ? "#D4EDDA"
                  : "#F8D7DA",
              }}
            >
              <ThemedText type="smallBold">
                {item.word}
              </ThemedText>

              <ThemedText>
                Your Answer: {item.selected}
              </ThemedText>

              <ThemedText>
                Correct Answer: {item.correct}
              </ThemedText>

              <ThemedText>
                {item.isCorrect ? "✅ Correct" : "❌ Wrong"}
              </ThemedText>
            </View>
          ))}

        <Pressable
          style={[styles.nextButton, { marginTop: 20 }]}
          onPress={() => {
            setCurrentIndex(0);
            setSelected(null);
            setAnswers([]);
            setShowResult(false);
            setReviewFilter("all");
          }}
        >
          <ThemedText type="smallBold">
            Retry Quiz
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ScrollView>
  );
}


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

        {/* Quiz Limit Selector */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 10,
          }}
        >
          {[10, 20, 50].map((limit) => (
            <Pressable
              key={limit}
              style={[
                styles.nextButton,
                {
                  backgroundColor:
                    quizLimit === limit ? "#1A3CBF" : "#666",
                },
              ]}
              onPress={() => {
                setQuizLimit(limit);
                setCurrentIndex(0);
              }}
            >
              <ThemedText>{limit}</ThemedText>
            </Pressable>
          ))}

          <Pressable
            style={[
              styles.nextButton,
              {
                backgroundColor:
                  quizLimit === shuffledWords.length
                    ? "#1A3CBF"
                    : "#666",
              },
            ]}
            onPress={() => {
              setQuizLimit(shuffledWords.length);
              setCurrentIndex(0);
            }}
          >
            <ThemedText>All</ThemedText>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText type="smallBold">
            Question {currentIndex + 1}/{limitedWords.length}
          </ThemedText>

          <ThemedText type="smallBold">
            What is the Hindi meaning of
          </ThemedText>

          <ThemedText type="title" style={styles.question}>
            {questionData?.word || "No learned words available"}
          </ThemedText>
        </View>

        <FlatList
          data={options}
          keyExtractor={(item, index) => `${item}-${index}`}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isSelected = selected === item;

            return (
              <Pressable
                onPress={() => handleSelect(item)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
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
  <Pressable
    style={({ pressed }) => [
      styles.nextButton,
      pressed && styles.optionPressed,
    ]}
    onPress={handleNext}
  >
    <ThemedText type="smallBold">
      {currentIndex === limitedWords.length - 1
        ? "Submit Quiz"
        : "Next Question"}
    </ThemedText>
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