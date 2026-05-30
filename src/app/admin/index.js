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
  const { authenticated, initialized, login, ADMIN_USERNAME } = useAdminAuth();
  const [username, setUsername] = useState(ADMIN_USERNAME);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialized && authenticated) {
      router.replace("/admin/dashboard");
    }
  }, [authenticated, initialized, router]);

  const handleLogin = () => {
    const success = login(username, password);
    if (success) {
      router.replace("/admin/dashboard");
      return;
    }

    setError("Invalid username or password.");
  };

  return (
    <ThemedView style={[styles.page, { backgroundColor: theme.background }]}> 
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.formCard}>
          <ThemedText type="subtitle" style={styles.title}>
            Admin Login
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            Enter credentials to manage vocabulary, categories, and quiz content.
          </ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText type="smallBold">Username</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Shivam"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              accessibilityLabel="Admin username"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="smallBold">Password</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              accessibilityLabel="Admin password"
            />
          </View>

          {error ? (
            <ThemedText type="default" themeColor="accent" style={styles.errorText}>
              {error}
            </ThemedText>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleLogin}
            accessibilityLabel="Login as admin"
          >
            <ThemedText type="smallBold" style={styles.loginText}>
              Login
            </ThemedText>
          </Pressable>

          <View style={styles.noteRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Admin credentials are hidden from normal navigation.
            </ThemedText>
          </View>
        </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
  },
  formCard: {
    width: "100%",
    maxWidth: 540,
    borderRadius: Spacing.five,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.two,
  },
  subtitle: {
    marginBottom: Spacing.four,
    lineHeight: 22,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Spacing.five,
    padding: Spacing.three,
    fontSize: 16,
  },
  loginButton: {
    borderRadius: Spacing.five,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.four,
  },
  loginText: {
    color: "#fff",
  },
  errorText: {
    marginTop: Spacing.one,
  },
  noteRow: {
    marginTop: Spacing.four,
  },
});
