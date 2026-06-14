import {
  TabList,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps
} from "expo-router/ui";
import { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

import { MaxContentWidth, Spacing } from "@/constants/theme";

const asHref = (path: string) => path as any;

export default function AppTabs() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Tabs>
      <TabSlot style={{ height: "100%" }} />

      <TabList asChild>
        <CustomTabList
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        >
          <TabTrigger name="index" href={asHref("/")} asChild>
            <TabButton>🏠 Home</TabButton>
          </TabTrigger>

          <TabTrigger name="vocabulary" href={asHref("/vocabulary")} asChild>
            <TabButton>📚 Vocabulary</TabButton>
          </TabTrigger>

          <TabTrigger name="quiz" href={asHref("/quiz")} asChild>
            <TabButton>📝 Quiz</TabButton>
          </TabTrigger>

          <TabTrigger name="revision" href={asHref("/revision")} asChild>
            <TabButton>🔄 Revision</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? "backgroundSelected" : "backgroundElement"}
        style={styles.tabButtonView}
      >
        <ThemedText
          type="small"
          themeColor={isFocused ? "text" : "textSecondary"}
        >
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList({
  menuOpen,
  setMenuOpen,
  ...props
}: any) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView
        type="backgroundElement"
        style={styles.innerContainer}
      >
        <Image
          source={require("../../assets/logo.png.jpeg")}
          style={styles.logo}
        />

        <Pressable
          onPress={() => setMenuOpen(!menuOpen)}
          style={styles.menuButton}
        >
          <ThemedText type="subtitle">☰</ThemedText>
        </Pressable>

        <ThemedText
          type="smallBold"
          style={styles.brandText}
        >
          SK Vocabulary
        </ThemedText>

        {menuOpen && (
          <View style={styles.dropdownMenu}>
            {props.children}
          </View>
        )}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: "absolute",
    width: "100%",
    padding: Spacing.three,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: "row",
    alignItems: "center",
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },

  logo: {
    width: 50,
    height: 50,
    borderRadius: Spacing.three,
  },

  brandText: {
    marginRight: "auto",
  },

  menuButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  dropdownMenu: {
    position: "absolute",
    top: 70,
    left: 70,
    width: "100%",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: "#fff",
    elevation: 5,
  },

  pressed: {
    opacity: 0.7,
  },

  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});