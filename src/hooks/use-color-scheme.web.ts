import { useEffect, useState } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";

import { readJson, STORAGE_KEYS } from "@/utils/local-storage";

export function useColorScheme() {
  const systemScheme = useRNColorScheme();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [appearance, setAppearance] = useState(() => readJson(STORAGE_KEYS.settings, {})?.appearance || "system");

  useEffect(() => {
    setHasHydrated(true);
    const sync = () => setAppearance(readJson(STORAGE_KEYS.settings, {})?.appearance || "system");
    window.addEventListener("vocab-settings-updated", sync);
    return () => window.removeEventListener("vocab-settings-updated", sync);
  }, []);

  if (!hasHydrated) return "light";
  if (appearance === "dark" || appearance === "light") return appearance;
  return systemScheme || "light";
}
