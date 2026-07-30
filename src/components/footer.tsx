import { Image, StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

export function Footer() {
  const theme = useTheme();
  const year = new Date().getFullYear();

  return (
    <ThemedView type="backgroundElement" style={styles.wrapper}>
      <View style={[styles.separator, { backgroundColor: theme.backgroundSelected }]} />
      <Image
        source={require("../../assets/logo.png.jpeg")}
        style={styles.footerLogo}
      />
      <View style={styles.content}>
        <View style={styles.brandSection}>
          <ThemedText type="smallBold">SK Blackbook Vocabulary App</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Founder: Shivam Yadav
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Made for Vocabulary Learning
          </ThemedText>
        </View>

        <View style={styles.sectionsGrid}>
          <View style={styles.sectionItem}>
            <ThemedText type="smallBold">About</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              A premium vocabulary app for daily growth.
            </ThemedText>
          </View>
          <View style={styles.sectionItem}>
            <ThemedText type="smallBold">Founder</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Shivam Yadav
            </ThemedText>
          </View>
          <View style={styles.sectionItem}>
            <ThemedText type="smallBold">Learning Platform</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Designed for vocabulary learning and retention.
            </ThemedText>
          </View>
          <View style={styles.sectionItem}>
  <ThemedText type="smallBold">Support & Contact</ThemedText>

  <ThemedText type="small" themeColor="textSecondary">
    Email: sklearningplatform@gmail.com
  </ThemedText>

  <ThemedText type="small" themeColor="textSecondary">
    We usually respond within 24–48 hours.
  </ThemedText>
</View>
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.copyright}>
        © {year} SK Blackbook Vocabulary App
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    alignItems: "center",
  },
  separator: {
    height: 1,
    width: "100%",
  },
  footerLogo: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
  },
  content: {
  gap: Spacing.four,
  width: "100%",
},
  brandSection: {
    gap: Spacing.one,
  },
  sectionsGrid: {
  flexDirection: "column",
  gap: Spacing.three,
  width: "100%",
},
  sectionItem: {
  width: "100%",
  gap: Spacing.one,
},
  copyright: {
    textAlign: "center",
  },
});
