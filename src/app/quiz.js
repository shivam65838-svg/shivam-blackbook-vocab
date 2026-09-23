import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabProgress } from "@/hooks/use-vocab-progress";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";
import { readJson, STORAGE_KEYS, writeJson } from "@/utils/local-storage";

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const getPrompt = (item, mode) => {
  if (mode === "Hindi → English") return item.hindiMeaning || item.word;
  if (mode === "Synonym") return item.word;
  if (mode === "Antonym") return item.word;
  return item.word;
};

const normalizeCategory = (value) =>
  value?.toString().trim().toLowerCase().replace(/s$/, "") || "";

const getCategoryAnswer = (item, mode) => {
  const category = normalizeCategory(item.category);
  const targetCategory = mode === "Synonym" ? "synonym" : "antonym";
  if (category !== targetCategory) return null;
  return item.hindiMeaning?.toString().trim() || null;
};

const getCorrect = (item, mode) => {
  if (mode === "Hindi → English") return item.word?.trim() || null;
  if (mode === "Synonym") {
    const value = Array.isArray(item.synonyms)
      ? item.synonyms.find((entry) => entry?.toString().trim())
      : null;
    return value?.toString().trim() || getCategoryAnswer(item, mode);
  }
  if (mode === "Antonym") {
    const value = Array.isArray(item.antonyms)
      ? item.antonyms.find((entry) => entry?.toString().trim())
      : null;
    return value?.toString().trim() || getCategoryAnswer(item, mode);
  }
  return item.hindiMeaning?.toString().trim() || null;
};

const isValidForMode = (item, mode) => {
  if (!item?.word?.toString().trim()) return false;
  if (mode === "Hindi → English") {
    return Boolean(item.hindiMeaning?.toString().trim() && item.word?.toString().trim());
  }
  return Boolean(getCorrect(item, mode));
};

const getWrongPool = (item, vocabulary, mode) => {
  const correct = getCorrect(item, mode);
  if (!correct) return [];

  return vocabulary
    .filter((candidate) => candidate.id !== item.id)
    .filter((candidate) => isValidForMode(candidate, mode))
    .map((candidate) => getCorrect(candidate, mode))
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .filter((value) => value !== correct);
};

const buildQuestions = (words, vocabulary, mode) => {
  const questions = [];

  for (const word of words) {
    const correct = getCorrect(word, mode);
    if (!correct) continue;

    const wrong = shuffle(getWrongPool(word, vocabulary, mode)).slice(0, 3);
    // Never create an incomplete question. A valid MCQ must have one correct
    // answer and three distinct, mode-appropriate distractors.
    if (wrong.length < 3) continue;

    const options = shuffle([correct, ...wrong]);
    if (new Set(options).size !== 4) continue;

    questions.push({
      id: word.id,
      word,
      prompt: getPrompt(word, mode),
      correct,
      options,
    });
  }

  return questions;
};

const saveQuizHistory = (entry) => {
  const history = readJson(STORAGE_KEYS.quizHistory, []);
  const next = [entry, ...(Array.isArray(history) ? history : [])].slice(0, 100);
  writeJson(STORAGE_KEYS.quizHistory, next);
};

export default function QuizScreen() {
  const theme = useTheme();
  const { items: vocabulary, loading } = useVocabularyData();
  const { learnedIds, pendingIds, weakIds, markQuizWrong } = useVocabProgress();
  const [mode, setMode] = useState("English → Hindi");
  const [source, setSource] = useState("All words");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(100);
  const [quizLimit, setQuizLimit] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [reviewFilter, setReviewFilter] = useState("all");

  const categories = useMemo(
    () => ["All", ...new Set(vocabulary.map((item) => item.category).filter(Boolean))],
    [vocabulary]
  );

  const buildPool = useCallback(() => {
    let pool = vocabulary;
    if (selectedCategory !== "All") pool = pool.filter((item) => item.category === selectedCategory);
    if (source === "Learned words") pool = pool.filter((item) => learnedIds.has(item.id));
    if (source === "Pending words") pool = pool.filter((item) => pendingIds.has(item.id));
    if (source === "Weak words") pool = pool.filter((item) => weakIds.has(item.id));
    pool = pool.slice(rangeStart, Math.min(rangeEnd, pool.length));

    // Only show words that can produce a complete, objectively valid MCQ.
    return pool.filter((word) => {
      if (!isValidForMode(word, mode)) return false;
      return getWrongPool(word, vocabulary, mode).length >= 3;
    });
  }, [learnedIds, mode, pendingIds, rangeEnd, rangeStart, selectedCategory, source, vocabulary, weakIds]);

  const startQuiz = () => {
    const pool = shuffle(buildPool());
    const requestedCount = quizLimit === "all" ? pool.length : Number(quizLimit);
    const built = buildQuestions(pool.slice(0, requestedCount), vocabulary, mode);
    setQuestions(built);
    setCurrentIndex(0);
    setSelected(null);
    setAnswers([]);
    setShowResult(false);
    setReviewFilter("all");
  };

  const current = questions[currentIndex];

  const handleNext = () => {
    if (!selected || !current) return;
    const answer = {
      id: current.id,
      word: current.word.word,
      correct: current.correct,
      selected,
      isCorrect: selected === current.correct,
    };
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setSelected(null);
    if (currentIndex >= questions.length - 1) {
      const correctCount = nextAnswers.filter((item) => item.isCorrect).length;
      const wrongIds = nextAnswers.filter((item) => !item.isCorrect).map((item) => item.id);
      if (wrongIds.length) markQuizWrong(wrongIds);
      saveQuizHistory({
        id: `quiz-${Date.now()}`,
        date: new Date().toISOString(),
        mode,
        source,
        category: selectedCategory,
        total: nextAnswers.length,
        correct: correctCount,
        wrong: nextAnswers.length - correctCount,
        accuracy: nextAnswers.length ? Math.round((correctCount / nextAnswers.length) * 100) : 0,
      });
      setShowResult(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
  };

  if (showResult) {
    const correctAnswers = answers.filter((a) => a.isCorrect).length;
    const wrongAnswers = answers.length - correctAnswers;
    const accuracy = answers.length ? Math.round((correctAnswers / answers.length) * 100) : 0;
    return (
      <ScrollView contentContainerStyle={[styles.resultPage, { backgroundColor: theme.background }]}>
        <ThemedText type="title">Quiz Result</ThemedText>
        <View style={[styles.resultHero, { backgroundColor: theme.surface }]}>
          <ThemedText type="subtitle">{correctAnswers}/{answers.length} correct</ThemedText>
          <ThemedText type="title">{accuracy}%</ThemedText>
          <ThemedText themeColor="textSecondary">Accuracy</ThemedText>
          <View style={styles.resultStats}>
            <ThemedText>✓ {correctAnswers} Correct</ThemedText>
            <ThemedText>✕ {wrongAnswers} Wrong</ThemedText>
          </View>
        </View>
        <View style={styles.filterRow}>
          {["all", "correct", "wrong"].map((filter) => (
            <Pressable key={filter} onPress={() => setReviewFilter(filter)} style={[styles.chip, { backgroundColor: reviewFilter === filter ? theme.accent : theme.surface }]}>
              <ThemedText type="smallBold">{filter[0].toUpperCase() + filter.slice(1)}</ThemedText>
            </Pressable>
          ))}
        </View>
        {answers.filter((item) => reviewFilter === "all" || (reviewFilter === "correct" ? item.isCorrect : !item.isCorrect)).map((item, index) => (
          <View key={`${item.id}-${index}`} style={[styles.reviewCard, { backgroundColor: item.isCorrect ? "#153b2c" : "#42212a" }]}>
            <ThemedText type="smallBold">{item.word}</ThemedText>
            <ThemedText>Your answer: {item.selected}</ThemedText>
            <ThemedText>Correct answer: {item.correct}</ThemedText>
            <ThemedText>{item.isCorrect ? "✓ Correct" : "✕ Added to weak words"}</ThemedText>
          </View>
        ))}
        <Pressable style={[styles.primaryButton, { backgroundColor: theme.accent }]} onPress={startQuiz}>
          <ThemedText type="smallBold">Retry Quiz</ThemedText>
        </Pressable>
        <Footer />
      </ScrollView>
    );
  }

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Vocabulary Quiz</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
              Start a fixed quiz session so questions and options never reshuffle while you answer.
            </ThemedText>
          </View>

          <ThemedText type="smallBold">Question mode</ThemedText>
          <View style={styles.chipRow}>
            {["English → Hindi", "Hindi → English", "Synonym", "Antonym"].map((item) => (
              <Pressable key={item} onPress={() => { setMode(item); setQuestions([]); }} style={[styles.chip, { backgroundColor: mode === item ? theme.accent : theme.surface }]}>
                <ThemedText type="small">{item}</ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="smallBold">Word source</ThemedText>
          <View style={styles.chipRow}>
            {["All words", "Learned words", "Pending words", "Weak words"].map((item) => (
              <Pressable key={item} onPress={() => { setSource(item); setQuestions([]); }} style={[styles.chip, { backgroundColor: source === item ? theme.accent : theme.surface }]}>
                <ThemedText type="small">{item}</ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="smallBold">Category</ThemedText>
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <Pressable key={cat} onPress={() => { setSelectedCategory(cat); setQuestions([]); }} style={[styles.chip, { backgroundColor: selectedCategory === cat ? theme.accent : theme.surface }]}>
                <ThemedText type="small">{cat}</ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="smallBold">Range</ThemedText>
          <View style={styles.chipRow}>
            {[[0, 100, "1–100"], [100, 200, "101–200"], [200, 300, "201–300"], [300, 400, "301–400"], [400, 500, "401–500"]].map(([start, end, label]) => (
              <Pressable key={label} onPress={() => { setRangeStart(start); setRangeEnd(end); setQuestions([]); }} style={[styles.chip, { backgroundColor: rangeStart === start && rangeEnd === end ? theme.accent : theme.surface }]}>
                <ThemedText type="small">{label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="smallBold">Questions</ThemedText>
          <View style={styles.chipRow}>
            {[10, 20, 50, "all"].map((limit) => (
              <Pressable key={String(limit)} onPress={() => { setQuizLimit(limit); setQuestions([]); }} style={[styles.chip, { backgroundColor: quizLimit === limit ? theme.accent : theme.surface }]}>
                <ThemedText type="small">{limit === "all" ? "All" : limit}</ThemedText>
              </Pressable>
            ))}
          </View>

          {!questions.length ? (
            <View style={[styles.startCard, { backgroundColor: theme.surface }]}>
              <ThemedText type="subtitle">Ready to test yourself?</ThemedText>
              <ThemedText themeColor="textSecondary">
                {loading
                  ? "Loading vocabulary…"
                  : `${buildPool().length} valid words match your current quiz settings. Words without the required ${mode.toLowerCase()} data are automatically skipped.`}
              </ThemedText>
              <Pressable disabled={loading || buildPool().length === 0} style={[styles.primaryButton, { backgroundColor: theme.accent, opacity: loading || buildPool().length === 0 ? 0.5 : 1 }]} onPress={startQuiz}>
                <ThemedText type="smallBold">Start Quiz</ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={[styles.questionCard, { backgroundColor: theme.surface }]}>
                <ThemedText type="smallBold">Question {currentIndex + 1} / {questions.length}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{mode}</ThemedText>
                <ThemedText type="smallBold">{mode === "Hindi → English" ? "Choose the English word" : mode === "English → Hindi" ? "Choose the Hindi meaning" : `Choose the ${mode.toLowerCase()}`}</ThemedText>
                <ThemedText type="title" style={styles.question}>{current?.prompt}</ThemedText>
              </View>
              {current?.options.map((option, index) => (
                <Pressable key={`${option}-${index}`} onPress={() => setSelected(option)} style={[styles.option, { backgroundColor: selected === option ? theme.accent : theme.surface }]}>
                  <ThemedText type="default">{option}</ThemedText>
                </Pressable>
              ))}
              <Pressable disabled={!selected} style={[styles.primaryButton, { backgroundColor: theme.accent, opacity: selected ? 1 : 0.45 }]} onPress={handleNext}>
                <ThemedText type="smallBold">{currentIndex === questions.length - 1 ? "Submit Quiz" : "Next Question"}</ThemedText>
              </Pressable>
            </>
          )}
          <Footer />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, safeArea: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.three },
  resultPage: { padding: Spacing.four, gap: Spacing.three },
  header: { gap: Spacing.two }, description: { lineHeight: 24 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  startCard: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.two },
  questionCard: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.two },
  question: { fontSize: 30, lineHeight: 38, marginTop: Spacing.one },
  option: { borderRadius: Spacing.five, padding: Spacing.four },
  primaryButton: { borderRadius: Spacing.five, padding: Spacing.three, alignItems: "center" },
  resultHero: { borderRadius: Spacing.five, padding: Spacing.five, alignItems: "center", gap: Spacing.two },
  resultStats: { flexDirection: "row", gap: Spacing.four, marginTop: Spacing.two },
  filterRow: { flexDirection: "row", gap: Spacing.two },
  reviewCard: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.one },
});
