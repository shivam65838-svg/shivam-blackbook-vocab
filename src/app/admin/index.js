import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useTheme } from "@/hooks/use-theme";

export default function AdminLogin() {
  const theme = useTheme();
  const router = useRouter();
  const { authenticated, initialized, login } = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialized && authenticated) router.replace("/admin/dashboard");
  }, [authenticated, initialized, router]);

  const handleLogin = async () => {
    setBusy(true);
    setError("");
    const success = await login(username, password);
    setBusy(false);
    if (success) router.replace("/admin/dashboard");
    else setError("Invalid username or password, or the admin API is not configured.");
  };

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}> 
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.formCard, { backgroundColor: theme.surface }]}>
          <ThemedText type="subtitle">Admin Login</ThemedText>
          <ThemedText type="default" themeColor="textSecondary">Admin credentials are verified on the server. They are not stored in the website source code.</ThemedText>
          <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text }]} value={username} onChangeText={setUsername} placeholder="Username" placeholderTextColor={theme.textSecondary} autoCapitalize="none" />
          <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.text }]} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={theme.textSecondary} secureTextEntry />
          {error ? <ThemedText themeColor="accent">{error}</ThemedText> : null}
          <Pressable disabled={busy} style={[styles.loginButton, { backgroundColor: theme.accent, opacity: busy ? 0.6 : 1 }]} onPress={handleLogin}>
            <ThemedText type="smallBold">{busy ? "Signing in…" : "Login"}</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, safeArea: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: Spacing.four },
  formCard: { width: "100%", maxWidth: 540, borderRadius: Spacing.five, padding: Spacing.four, gap: Spacing.three },
  input: { borderRadius: Spacing.five, padding: Spacing.three, fontSize: 16 },
  loginButton: { borderRadius: Spacing.five, paddingVertical: Spacing.three, alignItems: "center" },
});
