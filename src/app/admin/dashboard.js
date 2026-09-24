import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useAdminVocabularyData } from "@/hooks/use-admin-vocabulary-data";
import { useTheme } from "@/hooks/use-theme";


export default function AdminDashboard() {
  const theme = useTheme();
  const router = useRouter();
  const { authenticated, initialized, logout } = useAdminAuth();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");
  const {
    items,
    total,
    totalPages,
    stats,
    loading,
    error: dataError,
    rawCategories,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
    bulkAddVocabulary,
    bulkDeleteVocabulary,
    deleteCategoryVocabulary,
    addCategory,
    removeCategory,
    loadPage,
  } = useAdminVocabularyData({
    page,
    search,
    category: filterCategory,
    difficulty: filterDifficulty,
  });
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
  const [selectedIds, setSelectedIds] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!category && rawCategories?.[0]) setCategory(rawCategories[0]);
  }, [category, rawCategories]);
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
  };

  const handleSave = async () => {
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
      category: category || "Vocabulary",
      difficulty,
      status,
    };

    try {
      if (editingId) {
        await updateVocabulary(payload);
        setMessage("Vocabulary updated successfully.");
      } else {
        await addVocabulary(payload);
        setMessage("Vocabulary saved successfully.");
      }
      resetForm();
      setPage(1);
    } catch (error) {
      console.error("SAVE ERROR =", error);
      setMessage(error?.message || "Failed to save vocabulary.");
    }
  };

  const handleEdit = (item) => {
    setWord(item.word || "");
    setHindiMeaning(item.hindiMeaning || "");
    setExample(item.example || "");
    setMnemonic(item.mnemonic || "");
    setCategory(item.category || rawCategories?.[0] || "Vocabulary");
    setDifficulty(item.difficulty || "Medium");
setStatus(item.status || "New");
    setEditingId(item.id);
    setMessage("");
    router.replace("/admin/dashboard");
  };

const handleBulkImport = async () => {
  if (!bulkWords.trim()) {
    setMessage("Paste bulk vocabulary first.");
    return;
  }

  const lines = bulkWords.split("\n").map((line) => line.trim()).filter(Boolean);
  let imported = 0;
  let skipped = 0;

  const payload = [];
  for (const line of lines) {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length < 5) {
      skipped += 1;
      continue;
    }
    const [categoryName, importedWord, importedHindi, importedMnemonic, importedExample] = parts;
    if (!categoryName || !importedWord || !importedHindi) {
      skipped += 1;
      continue;
    }

    try {
      if (!(rawCategories || []).includes(categoryName)) {
        await addCategory(categoryName);
      }
      payload.push({
        id: `bulk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        word: importedWord,
        hindiMeaning: importedHindi,
        mnemonic: importedMnemonic,
        example: importedExample,
        category: categoryName,
        difficulty: "Medium",
        status: "New",
      });
    } catch (error) {
      console.error("Bulk Import Error:", error);
      skipped += 1;
    }
  }

  try {
    const result = await bulkAddVocabulary(payload);
    imported = result.imported || 0;
    skipped += result.skipped || 0;
  } catch (error) {
    skipped += payload.length;
    setMessage(error?.message || "Bulk import failed.");
  }
  setBulkWords("");
  setMessage(`${imported} words imported${skipped ? `, ${skipped} skipped` : ""}.`);
};

const handleDelete = async (itemId) => {
  const confirmed = typeof window !== "undefined" ? window.confirm("Delete this vocabulary item permanently?") : true;
  if (!confirmed) return;
  try {
    await deleteVocabulary(itemId);
    setSelectedIds((current) => current.filter((id) => id !== itemId));
    setMessage("Word deleted successfully.");
  } catch (error) {
    console.error(error);
    setMessage(error?.message || "Delete failed.");
  }
};

const refreshAdminData = async () => {
  setRefreshing(true);
  try {
    await loadPage();
    setMessage("Vocabulary refreshed from the production database.");
  } catch (error) {
    setMessage(error?.message || "Refresh failed.");
  } finally {
    setRefreshing(false);
  }
};

const confirmBulkDelete = (count, label) => {
  if (typeof window === "undefined") return false;

  const confirmation = window.prompt(
    `This will permanently delete ${count} vocabulary record${count === 1 ? "" : "s"} ${label}. Type DELETE to continue.`
  );

  return confirmation === "DELETE";
};

const toggleSelection = (id) => {
  setSelectedIds((current) =>
    current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id]
  );
};

const selectAllWords = () => {
  setSelectedIds(
    filteredItems.map(
      (item) => item.id
    )
  );
};




const clearSelection = () => {
  setSelectedIds([]);
};


  const deleteEntireCategory = async (categoryName) => {
    if (!confirmBulkDelete(
      "all",
      `in category "${categoryName}". This cannot be undone`
    )) return;
    try {
      const result = await deleteCategoryVocabulary(categoryName);
      await removeCategory(categoryName);
      setMessage(`${result.deletedCount || 0} words deleted from ${categoryName}`);
    } catch (error) {
      console.error(error);
      setMessage(error?.message || "Category delete failed.");
    }
  };

  const deleteSelectedWords = async () => {
    if (!selectedIds.length) {
      setMessage("No words selected.");
      return;
    }
    if (!confirmBulkDelete(selectedIds.length, "from the current selection")) return;
    try {
      await bulkDeleteVocabulary(selectedIds);
      setSelectedIds([]);
      setMessage("Selected words deleted.");
    } catch (error) {
      console.error(error);
      setMessage(error?.message || "Bulk delete failed.");
    }
  };

const categoryChips = useMemo(
  () => (rawCategories || []).map((option) => ({
    label: option,
  })),
  [rawCategories]
);
const filteredItems = items;
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
              Add or edit vocabulary items stored in the central vocabulary database. User learning progress remains local to each browser.
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
            <ThemedText type="small" themeColor="textSecondary">
              Showing {filteredItems.length} of {total} matching records · {stats.total || total} total vocabulary
            </ThemedText>
            <View style={styles.statsRow}>
              <ThemedText type="smallBold">Total: {stats.total || total}</ThemedText>
              <ThemedText type="smallBold">Categories: {stats.categories || 0}</ThemedText>
              {(stats.difficulties || []).map((item) => (
                <ThemedText key={item.difficulty || "unknown"} type="smallBold">
                  {item.difficulty || "Unknown"}: {item.count}
                </ThemedText>
              ))}
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search word, meaning, mnemonic, or example"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Search vocabulary"
            />
            <Pressable
              disabled={refreshing}
              style={[styles.saveButton, { opacity: refreshing ? 0.6 : 1 }]}
              onPress={refreshAdminData}
            >
              <ThemedText type="smallBold">
                {refreshing ? "Refreshing..." : "Refresh from production API"}
              </ThemedText>
            </Pressable>
            <View
  style={{
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 10,
  }}
>
  <Pressable
    style={[
      styles.categoryChip,
      {
        backgroundColor:
          filterCategory === "All"
            ? theme.accent
            : theme.background,
      },
    ]}
    onPress={() =>
      (setFilterCategory("All"), setPage(1))
    }
  >
    <ThemedText>All</ThemedText>
  </Pressable>

  {(rawCategories || []).map((cat) => (
    <Pressable
      key={cat}
      style={[
        styles.categoryChip,
        {
          backgroundColor:
            filterCategory === cat
              ? theme.accent
              : theme.background,
        },
      ]}
      onPress={() =>
        (setFilterCategory(cat), setPage(1))
      }
    >
      <ThemedText>{cat}</ThemedText>
    </Pressable>
  ))}
</View>

  <View style={styles.chipRow}>
    {['All', 'Easy', 'Medium', 'Hard'].map((option) => (
      <Pressable
        key={option}
        style={[
          styles.categoryChip,
          { backgroundColor: filterDifficulty === option ? theme.accent : theme.background },
        ]}
        onPress={() => {
          setFilterDifficulty(option);
          setPage(1);
        }}
      >
        <ThemedText type="smallBold">{option}</ThemedText>
      </Pressable>
    ))}
  </View>

            <View
  style={{
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 15,
  }}
>
  <Pressable
    style={styles.saveButton}
    onPress={selectAllWords}
  >
    <ThemedText type="smallBold">
      Select All
    </ThemedText>
  </Pressable>

  <Pressable
    style={styles.saveButton}
    onPress={clearSelection}
  >
    <ThemedText type="smallBold">
      Clear
    </ThemedText>
  </Pressable>

  <Pressable
    style={[
      styles.saveButton,
      { backgroundColor: "#EF4444" },
    ]}
    onPress={deleteSelectedWords}
  >
    <ThemedText
      type="smallBold"
      style={{ color: "#FFFFFF" }}
    >
      Delete Selected
    </ThemedText>
  </Pressable>

  
</View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.panelSubtitle}>
              Use edit and delete controls to manage existing entries.
            </ThemedText>

            {loading ? (
              <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
                Loading page {page}...
              </ThemedText>
            ) : dataError ? (
              <ThemedText type="default" themeColor="accent" style={styles.emptyText}>
                {dataError}
              </ThemedText>
            ) : items.length === 0 ? (
              <ThemedText type="default" themeColor="textSecondary" style={styles.emptyText}>
                No vocabulary items available.
              </ThemedText>
            ) : (
              filteredItems.map((item) => (
                <View key={item.id} style={[styles.listItem, { backgroundColor: theme.background }]}> 
                  <View style={styles.listText}>

  <Pressable
    onPress={() => toggleSelection(item.id)}
    style={{ marginBottom: 8 }}
  >
    <ThemedText>
      {selectedIds.includes(item.id)
        ? "☑ Selected"
        : "☐ Select"}
    </ThemedText>
  </Pressable>

  <ThemedText type="smallBold">
    {item.word}
  </ThemedText>

  <ThemedText
    type="small"
    themeColor="textSecondary"
  >
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
            <View style={styles.paginationRow}>
              <Pressable
                disabled={page <= 1 || loading}
                style={[styles.actionButton, { opacity: page <= 1 || loading ? 0.45 : 1 }]}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ThemedText type="smallBold">Previous</ThemedText>
              </Pressable>
              <ThemedText type="smallBold">
                Page {page} of {totalPages} · {total} records
              </ThemedText>
              <Pressable
                disabled={page >= totalPages || loading}
                style={[styles.actionButton, { opacity: page >= totalPages || loading ? 0.45 : 1 }]}
                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <ThemedText type="smallBold">Next</ThemedText>
              </Pressable>
            </View>
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
                  value={newCategory}
                  onChangeText={setNewCategory}
                />
                <Pressable
                  style={({ pressed }) => [styles.saveButton, { paddingHorizontal: Spacing.three }]}
                  onPress={async () => {
                    if (!newCategory.trim()) return;
                    try {
                      await addCategory(newCategory);
                      setNewCategory("");
                      setMessage("Category added successfully.");
                    } catch (error) {
                      setMessage(error?.message || "Failed to add category.");
                    }
                  }}
                >
                  <ThemedText type="smallBold">Add</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.categoryList}>
  {(rawCategories || []).map((item) => (
    <View
      key={item}
      style={[
        styles.categoryCard,
        {
          backgroundColor: theme.background,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
      ]}
    >
      <ThemedText type="default">
        {item}
      </ThemedText>

      <View
        style={{
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Pressable
          onPress={() =>
            deleteEntireCategory(item)
          }
          style={[
            styles.actionButton,
            {
              backgroundColor: "#EF4444",
            },
          ]}
        >
          <ThemedText
            type="smallBold"
            style={{ color: "#FFFFFF" }}
          >
            Delete Words
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() =>
            removeCategory(item)
          }
          style={styles.actionButton}
        >
          <ThemedText
            type="smallBold"
            themeColor="accent"
          >
            Delete
          </ThemedText>
        </Pressable>
      </View>
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
  paddingHorizontal: Spacing.three,
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
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  categoryCard: {
    borderRadius: Spacing.five,
    padding: Spacing.three,
    minWidth: 120,
  },
});
