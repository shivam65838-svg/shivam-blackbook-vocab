import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useTheme } from "@/hooks/use-theme";
import { useVocabularyData } from "@/hooks/use-vocabulary-data";


export default function AdminDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { authenticated, initialized, logout } = useAdminAuth();
  const {
    items,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
    categories,
    rawCategories,
    addCategory,
    removeCategory,
  } = useVocabularyData();
  const [word, setWord] = useState("");
  const [hindiMeaning, setHindiMeaning] = useState("");
  const [example, setExample] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [category, setCategory] = useState(rawCategories?.[0] || "Vocabulary");
  const [difficulty, setDifficulty] = useState("Medium");
  const [status, setStatus] = useState("New");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [bulkWords, setBulkWords] = useState("");

  useEffect(() => {
    if (initialized && !authenticated) {
      router.replace("/admin");
    }
  }, [authenticated, initialized, router]);

  const resetForm = () => {
    setWord("");
    setHindiMeaning("");
    setExample("");
    setMnemonic("");
    setCategory(rawCategories?.[0] || "Vocabulary");
    setDifficulty("Medium");
    setStatus("New");
    setEditingId(null);
    setMessage("");
  };

  const handleSave = () => {
    if (!word.trim() || !hindiMeaning.trim()) {
      setMessage("Word and Hindi meaning are required.");
      return;
    }

    const payload = {
      id: editingId || `admin-${Date.now()}`,
      word: word.trim(),
      hindiMeaning: hindiMeaning.trim(),
      example: example.trim(),
      mnemonic: mnemonic.trim(),
      category,
      difficulty,
      status,
    };

    if (editingId) {
      updateVocabulary(payload);
    } else {
      addVocabulary(payload);
    }

    resetForm();
    setMessage(editingId ? "Vocabulary updated successfully." : "Vocabulary added successfully.");
  };

  const handleEdit = (item) => {
    setWord(item.word || "");
    setHindiMeaning(item.hindiMeaning || "");
    setExample(item.example || "");
    setMnemonic(item.mnemonic || "");
    setCategory(item.category || rawCategories?.[0] || "Vocabulary");
    setEditingId(item.id);
    setMessage("");
    router.replace("/admin/dashboard");
  };

const handleBulkImport = () => {
  if (!bulkWords.trim()) {
    setMessage("Paste bulk vocabulary first.");
    return;
  }

  const lines = bulkWords
    .split("\n")
    .filter((line) => line.trim());

  let imported = 0;

  lines.forEach((line) => {
    const parts = line.split("|");

    if (parts.length < 5) return;

    const [
      categoryName,
      word,
      hindiMeaning,
      mnemonic,
      example,
    ] = parts.map((p) => p.trim());

    const alreadyExists = items.some(
      (item) =>
        item.word?.toLowerCase() === word.toLowerCase()
    );

    if (alreadyExists) return;

    if (
      categoryName &&
      !(rawCategories || []).includes(categoryName)
    ) {
      addCategory(categoryName);
    }

    addVocabulary({
      id: `bulk-${Date.now()}-${Math.random()}`,
      word,
      hindiMeaning,
      mnemonic,
      example,
      category: categoryName,
      difficulty: "Medium",
      status: "New",
    });

    imported++;
  });

  setBulkWords("");
  setMessage(`${imported} words imported successfully.`);
};

const handleDelete = (itemId) => {
  const confirmed =
    typeof window !== "undefined"
      ? window.confirm("Delete this vocabulary item permanently?")
      : true;

  if (confirmed) {
    deleteVocabulary(itemId);

    if (editingId === itemId) {
      resetForm();
    }

    setMessage("Vocabulary item deleted.");
  }

  
};

const categoryChips = useMemo(
  () => (rawCategories || []).map((option) => ({
    label: option,
  })),
  [rawCategories]
);

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}> 
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <ThemedText type="title">Admin Dashboard</ThemedText>
              <ThemedText type="default" themeColor="textSecondary" style={styles.headerSubtitle}>
                Manage vocabulary entries, supported categories, and quiz content.
              </ThemedText>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.logoutButton,
                { opacity: pressed ? 0.8 : 1, backgroundColor: theme.surface },
              ]}
              onPress={logout}
            >
              <ThemedText type="smallBold">Logout</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.surface }]}> 
            <ThemedText type="subtitle">Add Vocabulary</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.panelSubtitle}>
              Add or edit vocabulary items stored in local browser storage.
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Word</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                value={word}
                onChangeText={setWord}
                placeholder="Example: Ambivalent"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Vocabulary word"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Hindi Meaning</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                value={hindiMeaning}
                onChangeText={setHindiMeaning}
                placeholder="Hindi meaning"
                placeholderTextColor={theme.textSecondary}
                accessibilityLabel="Hindi meaning"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Example</ThemedText>
              <TextInput
                style={[styles.input, styles.multiline, { backgroundColor: theme.background, color: theme.text }]}
                value={example}
                onChangeText={setExample}
                placeholder="Use the word in a sentence"
                placeholderTextColor={theme.textSecondary}
                multiline
                accessibilityLabel="Example sentence"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Mnemonic</ThemedText>
              <TextInput
                style={[styles.input, styles.multiline, { backgroundColor: theme.background, color: theme.text }]}
                value={mnemonic}
                onChangeText={setMnemonic}
                placeholder="Mnemonic hint"
                placeholderTextColor={theme.textSecondary}
                multiline
                accessibilityLabel="Mnemonic"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Category</ThemedText>
              <View style={styles.chipRow}>
                {categoryChips.map((option) => {
                  const selected = option.label === category;
                  return (
                    <Pressable
                      key={option.label}
                      style={[
                        styles.categoryChip,
                        {
                          borderColor: selected ? theme.accent : theme.textSecondary,
                          backgroundColor: selected ? theme.accent : theme.background,
                        },
                      ]}
                      onPress={() => setCategory(option.label)}
                    >
                      <ThemedText
                        type={selected ? "smallBold" : "default"}
                        themeColor={selected ? "text" : "textSecondary"}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Difficulty</ThemedText>
              <View style={styles.chipRow}>
                {["Easy", "Medium", "Hard"].map((d) => {
                  const sel = d === difficulty;
                  return (
                    <Pressable
                      key={d}
                      style={[
                        styles.categoryChip,
                        { borderColor: sel ? theme.accent : theme.textSecondary, backgroundColor: sel ? theme.accent : theme.background },
                      ]}
                      onPress={() => setDifficulty(d)}
                    >
                      <ThemedText type={sel ? "smallBold" : "default"} themeColor={sel ? "text" : "textSecondary"}>
                        {d}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Status</ThemedText>
              <View style={styles.chipRow}>
                {["New", "Learning", "Learned", "Pending Revision"].map((s) => {
                  const sel = s === status;
                  return (
                    <Pressable
                      key={s}
                      style={[
                        styles.categoryChip,
                        { borderColor: sel ? theme.accent : theme.textSecondary, backgroundColor: sel ? theme.accent : theme.background },
                      ]}
                      onPress={() => setStatus(s)}
                    >
                      <ThemedText type={sel ? "smallBold" : "default"} themeColor={sel ? "text" : "textSecondary"}>
                        {s}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {message ? (
              <ThemedText type="default" themeColor="accent" style={styles.messageText}>
                {message}
              </ThemedText>
            ) : null}
<View style={styles.inputGroup}>
  <ThemedText type="smallBold">
    Bulk Import Vocabulary
  </ThemedText>

  <TextInput
    style={[
      styles.input,
      styles.multiline,
      {
        backgroundColor: theme.background,
        color: theme.text,
        minHeight: 220,
      },
    ]}
    multiline
    value={bulkWords}
    onChangeText={setBulkWords}
    placeholder={`Vocabulary|Abandon|छोड़ देना|A-Band-On|He abandoned the old house.

Vocabulary|Ability|क्षमता|Able hone ki quality|She has ability.

Root Words|Aqua|जल|Aqua means water|Aquarium contains water.`}
    placeholderTextColor={theme.textSecondary}
  />

  <Pressable
    style={[
      styles.saveButton,
      { backgroundColor: theme.accent },
    ]}
    onPress={handleBulkImport}
  >
    <ThemedText
      type="smallBold"
      style={styles.saveText}
    >
      Import All Words
    </ThemedText>
  </Pressable>
</View>
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: theme.accent, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={handleSave}
            >
              <ThemedText type="smallBold" style={styles.saveText}>
                {editingId ? "Update Vocabulary" : "Save Vocabulary"}
              </ThemedText>
            </Pressable>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.surface }]}> 
            <ThemedText type="subtitle">Edit / Delete Vocabulary</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.panelSubtitle}>
              Use edit and delete controls to manage existing entries.
            </ThemedText>

            {items.length === 0 ? (
              <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
                No vocabulary items available.
              </ThemedText>
            ) : (
              items.map((item) => (
                <View key={item.id} style={[styles.listItem, { backgroundColor: theme.background }]}> 
                  <View style={styles.listText}>
                    <ThemedText type="smallBold">{item.word}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.hindiMeaning} · {item.category}
                    </ThemedText>
                  </View>
                  <View style={styles.itemActions}>
                    <Pressable
                      style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                      onPress={() => handleEdit(item)}
                    >
                      <ThemedText type="smallBold">Edit</ThemedText>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
                      onPress={() => handleDelete(item.id)}
                    >
                      <ThemedText type="smallBold" themeColor="accent">
                        Delete
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={[styles.panel, { backgroundColor: theme.surface }]}> 
            <ThemedText type="subtitle">Manage Categories</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.panelSubtitle}>
              Supported categories for the admin vocabulary forms. Add or remove categories below.
            </ThemedText>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Add category</ThemedText>
              <View style={{ flexDirection: "row", gap: Spacing.two }}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: theme.background, color: theme.text }]}
                  placeholder="New category"
                  placeholderTextColor={theme.textSecondary}
                  value={undefined}
                  onChangeText={() => {}}
                />
                <Pressable
                  style={({ pressed }) => [styles.saveButton, { paddingHorizontal: Spacing.three }]}
                  onPress={() => {
                    /* placeholder: adding via prompt to keep implementation small */
                    const name = typeof window !== "undefined" ? window.prompt("New category label:") : null;
                    if (name) addCategory(name);
                  }}
                >
                  <ThemedText type="smallBold">Add</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.categoryList}>
              {(rawCategories || []).map((item) => (
                <View key={item} style={[styles.categoryCard, { backgroundColor: theme.background, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}> 
                  <ThemedText type="default">{item}</ThemedText>
                  <Pressable onPress={() => removeCategory(item)} style={styles.actionButton}>
                    <ThemedText type="smallBold" themeColor="accent">Delete</ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.panel, { backgroundColor: theme.surface, marginBottom: BottomTabInset + Spacing.four }]}> 
            <ThemedText type="subtitle">Manage Quiz</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.panelSubtitle}>
              Quiz management is available through saved vocabulary. New items will be included automatically when reviewing and quizzing.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Use the vocabulary editor above to keep the quiz database fresh. Quiz state is handled by the app and reflects saved entries.
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
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.four,
  },
  headerTextBlock: {
    flex: 1,
    gap: Spacing.one,
  },
  headerSubtitle: {
    maxWidth: 520,
    lineHeight: 22,
  },
  logoutButton: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  panel: {
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  panelSubtitle: {
    lineHeight: 22,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: Spacing.three,
    fontSize: 16,
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  saveButton: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
  },
  messageText: {
    marginTop: Spacing.one,
  },
  listItem: {
    borderRadius: Spacing.five,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  listText: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  itemActions: {
    flexDirection: "row",
    gap: Spacing.two,
    flexWrap: "wrap",
  },
  actionButton: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  actionPressed: {
    opacity: 0.7,
  },
  emptyText: {
    marginTop: Spacing.two,
    lineHeight: 22,
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  categoryCard: {
    borderRadius: Spacing.five,
    padding: Spacing.three,
    minWidth: 120,
  },
});
