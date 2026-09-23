import { useCallback, useEffect, useMemo, useState } from "react";

import { removeKey } from "@/utils/local-storage";

// Master vocabulary always comes from the Neon database through the Vercel API.
// User-specific learning data is handled separately by use-vocab-progress and
// remains in browser localStorage.
const DEPLOYED_API_BASE = "https://shivam-blackbook-vocab.vercel.app/api";

const getApiBase = () => {
  if (typeof window === "undefined") return "/api";

  const hostname = window.location.hostname;
  const isLocalBrowser = hostname === "localhost" || hostname === "127.0.0.1";

  // Local Expo web testing uses the deployed Vercel API so it can read the
  // live Neon vocabulary database. Production uses this deployment's /api.
  return isLocalBrowser
    ? DEPLOYED_API_BASE
    : `${window.location.origin}/api`;
};

const normalizeItem = (item = {}) => ({
  ...item,
  id: item.id?.toString() || item.word?.toString().trim().toLowerCase(),
  word: item.word?.toString().trim() || "",
  hindiMeaning:
    item.hindiMeaning ?? item.hindi_meaning ?? item.meaning ?? "",
  mnemonic: item.mnemonic ?? "",
  example: item.example ?? "",
  category: item.category?.toString().trim() || "Vocabulary",
  difficulty: ["Easy", "Medium", "Hard"].includes(item.difficulty)
    ? item.difficulty
    : "Medium",
  status: item.status || "New",
  synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
  antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
});

const normalizeList = (data) =>
  Array.isArray(data)
    ? data.map(normalizeItem).filter((item) => item.word)
    : [];

async function request(path, options = {}) {
  const apiBase = getApiBase();
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
}

export function useVocabularyData() {
  // IMPORTANT: Never initialize master vocabulary from localStorage or the
  // bundled 81-word JSON. The database is the only source of truth.
  const [items, setItems] = useState([]);
  const [categoriesState, setCategoriesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyItems = useCallback((data) => {
    const formatted = normalizeList(data);
    setItems(formatted);
    return formatted;
  }, []);

  const applyCategories = useCallback((data) => {
    const names = Array.isArray(data)
      ? data
          .map((item) => (typeof item === "string" ? item : item?.name))
          .filter(Boolean)
      : [];
    const unique = Array.from(new Set(names));
    setCategoriesState(unique);
    return unique;
  }, []);

  const refreshVocabulary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/vocabulary");
      if (!Array.isArray(data)) {
        throw new Error("Vocabulary API returned an invalid response.");
      }
      return applyItems(data);
    } catch (err) {
      const message = err?.message || "Unable to load vocabulary from database.";
      setError(message);
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [applyItems]);

  const refreshCategories = useCallback(async () => {
    try {
      const data = await request("/categories");
      return applyCategories(data);
    } catch (err) {
      setError(err?.message || "Unable to load categories from database.");
      setCategoriesState([]);
      return [];
    }
  }, [applyCategories]);

  useEffect(() => {
    // Remove vocabulary/category caches created by older versions. They are
    // intentionally no longer used because master content must stay in Neon.
    removeKey("shivam-blackbook-vocab-data");
    removeKey("shivam-blackbook-vocab-categories");

    let active = true;
    (async () => {
      setLoading(true);
      setError("");
      const [wordsResult, categoriesResult] = await Promise.allSettled([
        request("/vocabulary"),
        request("/categories"),
      ]);

      if (!active) return;

      if (wordsResult.status === "fulfilled" && Array.isArray(wordsResult.value)) {
        applyItems(wordsResult.value);
      } else {
        setItems([]);
        setError(
          wordsResult.reason?.message ||
            "Unable to load vocabulary from the Neon database."
        );
      }

      if (categoriesResult.status === "fulfilled") {
        applyCategories(categoriesResult.value);
      }

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [applyItems, applyCategories]);

  const addVocabulary = useCallback(async (raw) => {
    const entry = normalizeItem(raw);
    if (!entry.word || !entry.hindiMeaning) {
      throw new Error("Word and Hindi meaning are required.");
    }

    await request("/vocabulary", {
      method: "POST",
      body: JSON.stringify({
        id: entry.id || `vocab-${Date.now()}`,
        word: entry.word,
        hindi_meaning: entry.hindiMeaning,
        mnemonic: entry.mnemonic,
        example: entry.example,
        category: entry.category,
        difficulty: entry.difficulty,
        status: entry.status,
      }),
    });

    await refreshVocabulary();
    return entry;
  }, [refreshVocabulary]);

  const updateVocabulary = useCallback(async (raw) => {
    const entry = normalizeItem(raw);
    await request("/vocabulary", {
      method: "PUT",
      body: JSON.stringify({
        id: entry.id,
        word: entry.word,
        hindi_meaning: entry.hindiMeaning,
        mnemonic: entry.mnemonic,
        example: entry.example,
        category: entry.category,
        difficulty: entry.difficulty,
        status: entry.status,
      }),
    });

    await refreshVocabulary();
    return entry;
  }, [refreshVocabulary]);

  const deleteVocabulary = useCallback(async (id) => {
    await request("/vocabulary", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    await refreshVocabulary();
  }, [refreshVocabulary]);

  const addCategory = useCallback(async (label) => {
    const clean = label?.toString().trim();
    if (!clean) throw new Error("Category name is required.");
    await request("/categories", {
      method: "POST",
      body: JSON.stringify({ name: clean }),
    });
    return refreshCategories();
  }, [refreshCategories]);

  const removeCategory = useCallback(async (label) => {
    await request("/categories", {
      method: "DELETE",
      body: JSON.stringify({ name: label }),
    });
    return refreshCategories();
  }, [refreshCategories]);

  const categories = useMemo(
    () => ["All", ...categoriesState.filter((item) => item !== "All")],
    [categoriesState]
  );

  return {
    items,
    setItems,
    categories,
    rawCategories: categoriesState,
    loading,
    error,
    refreshVocabulary,
    refreshCategories,
    addCategory,
    removeCategory,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
  };
}
