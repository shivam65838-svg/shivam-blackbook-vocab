import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

import { Footer } from "@/components/footer";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useVocabProgress } from "@/hooks/use-vocab-progress";
import { emitStorageEvent, readJson, removeKey, STORAGE_KEYS, writeJson } from "@/utils/local-storage";

export default function SettingsScreen() {
  const theme = useTheme();
  const { dailyTarget, setDailyTarget } = useVocabProgress();
  const [settings, setSettings] = useState(() => ({
    appearance: readJson(STORAGE_KEYS.settings, {})?.appearance || "system",
    notifications: readJson(STORAGE_KEYS.settings, {})?.notifications !== false,
    reviewMode: readJson(STORAGE_KEYS.settings, {})?.reviewMode !== false,
  }));
  const [message, setMessage] = useState("");
  const [goalInput, setGoalInput] = useState(String(dailyTarget));

  const updateSettings = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    writeJson(STORAGE_KEYS.settings, next);
    emitStorageEvent("vocab-settings-updated");
    setMessage("Settings saved.");
  };

  const exportData = () => {
    if (typeof window === "undefined") return;
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      progress: readJson(STORAGE_KEYS.progress, {}),
      quizHistory: readJson(STORAGE_KEYS.quizHistory, []),
      settings: readJson(STORAGE_KEYS.settings, {}),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sk-vocabulary-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Backup exported successfully.");
  };

  const importData = () => {
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const payload = JSON.parse(String(reader.result || "{}"));
          if (payload.progress) writeJson(STORAGE_KEYS.progress, payload.progress);
          if (payload.quizHistory) writeJson(STORAGE_KEYS.quizHistory, payload.quizHistory);
          if (payload.settings) writeJson(STORAGE_KEYS.settings, payload.settings);
          emitStorageEvent();
          emitStorageEvent("vocab-settings-updated");
          setMessage("Backup imported. Reload the page if you want every screen to refresh immediately.");
        } catch {
          setMessage("Invalid backup file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const resetAll = () => {
    const confirmed = typeof window === "undefined" || window.confirm("Reset all personal learning data? This will remove progress, streaks, quiz history and settings from this browser.");
    if (!confirmed) return;
    removeKey(STORAGE_KEYS.progress);
    removeKey(STORAGE_KEYS.quizHistory);
    removeKey(STORAGE_KEYS.settings);
    emitStorageEvent();
    emitStorageEvent("vocab-settings-updated");
    setGoalInput("30");
    setMessage("Personal learning data reset. Vocabulary content remains available.");
  };

  const saveGoal = () => {
    const value = Math.min(200, Math.max(5, Number(goalInput) || 30));
    setDailyTarget(value);
    setGoalInput(String(value));
    setMessage(`Daily goal set to ${value} words.`);
  };

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Settings</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.description}>
              Your personal learning data stays in this browser's local storage.
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold">Daily goal</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Choose how many words you want to complete each day.</ThemedText>
            <View style={styles.goalRow}>
              <TextInput value={goalInput} onChangeText={setGoalInput} keyboardType="numeric" style={[styles.goalInput, { backgroundColor: theme.background, color: theme.text }]} />
              <ThemedText>words</ThemedText>
              <Pressable onPress={saveGoal} style={[styles.smallButton, { backgroundColor: theme.accent }]}><ThemedText type="smallBold">Save</ThemedText></Pressable>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold">Learning preferences</ThemedText>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}><ThemedText>Daily reminders</ThemedText><ThemedText type="small" themeColor="textSecondary">Keep reminder preference locally.</ThemedText></View>
              <Switch value={settings.notifications} onValueChange={(value) => updateSettings({ notifications: value })} />
            </View>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}><ThemedText>Smart review mode</ThemedText><ThemedText type="small" themeColor="textSecondary">Use pending and weak words in revision.</ThemedText></View>
              <Switch value={settings.reviewMode} onValueChange={(value) => updateSettings({ reviewMode: value })} />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold">Appearance</ThemedText>
            <View style={styles.chipRow}>
              {["system", "light", "dark"].map((value) => (
                <Pressable key={value} onPress={() => updateSettings({ appearance: value })} style={[styles.chip, { backgroundColor: settings.appearance === value ? theme.accent : theme.background }]}>
                  <ThemedText type="smallBold">{value[0].toUpperCase() + value.slice(1)}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold">Data backup</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Export your local progress before clearing browser data or moving to another computer.</ThemedText>
            <View style={styles.buttonRow}>
              <Pressable onPress={exportData} style={[styles.smallButton, { backgroundColor: theme.accent }]}><ThemedText type="smallBold">Export backup</ThemedText></Pressable>
              <Pressable onPress={importData} style={[styles.smallButton, { backgroundColor: theme.backgroundElement }]}><ThemedText type="smallBold">Import backup</ThemedText></Pressable>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText type="smallBold">Reset personal data</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Removes learned/pending progress, streaks, weak-word flags, quiz history and settings. Vocabulary content is not deleted.</ThemedText>
            <Pressable onPress={resetAll} style={[styles.dangerButton]}><ThemedText type="smallBold" style={{ color: "#fff" }}>Reset my learning data</ThemedText></Pressable>
          </View>

          {message ? <ThemedText type="smallBold" themeColor="accent">{message}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary">SK Vocabulary 2.0 · Local-first learning</ThemedText>
          <Footer />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, safeArea: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.four, paddingTop: Spacing.four, paddingBottom: BottomTabInset + Spacing.four, gap: Spacing.four },
  header: { gap: Spacing.two }, description: { lineHeight: 22 },
  card: { borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.three },
  goalRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  goalInput: { width: 90, borderRadius: Spacing.five, padding: Spacing.three, fontSize: 16 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.three, paddingVertical: Spacing.two },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  buttonRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  smallButton: { borderRadius: Spacing.five, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  dangerButton: { borderRadius: Spacing.five, paddingVertical: Spacing.three, alignItems: "center", backgroundColor: "#DC2626" },
});
