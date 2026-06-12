import {
  DarkTheme,
  DefaultTheme,
  Slot,
  ThemeProvider,
  useSegments,
} from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();

  const isAdminRoute = segments?.[0] === "admin";

  useEffect(() => {
    if (typeof window === "undefined") return;

    const script1 = document.createElement("script");
    script1.async = true;
    script1.src =
      "https://www.googletagmanager.com/gtag/js?id=G-K8ZGMD8W60";
    document.head.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-K8ZGMD8W60');
    `;
    document.head.appendChild(script2);

    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <AnimatedSplashOverlay />
      {isAdminRoute ? <Slot /> : <AppTabs />}
    </ThemeProvider>
  );
}