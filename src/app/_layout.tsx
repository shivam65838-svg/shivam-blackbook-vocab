import { Analytics } from "@vercel/analytics/react";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider, useSegments } from "expo-router";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();

  // If the first path segment is `admin`, render the routed admin pages
  // directly (outside the tab layout). Otherwise render the main AppTabs.
  const isAdminRoute = segments?.[0] === "admin";

  return (
  <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
    <AnimatedSplashOverlay />
    {isAdminRoute ? <Slot /> : <AppTabs />}
    <Analytics />
  </ThemeProvider>
);
}
