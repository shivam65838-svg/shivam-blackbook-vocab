import { useCallback, useEffect, useMemo, useState } from "react";

import { removeKey } from "@/utils/local-storage";

// ============================================================
// MASTER VOCABULARY
// ============================================================
// Master vocabulary always comes from Neon through the Vercel API.
// User-specific learning data remains in browser localStorage.
// ============================================================

const DEPLOYED_API_BASE =
  "https://shivam-blackbook-vocab.vercel.app/api";

const getApiBase = () => {
  if (typeof window === "undefined") {
    return "/api";
  }

  const hostname = window.location.hostname;

  const isLocalBrowser =
    hostname === "localhost" || hostname === "127.0.0.1";

  // Local Expo web testing uses the live Vercel API.
  if (isLocalBrowser) {
    return DEPLOYED_API_BASE;
  }

  // Production website uses its own /api routes.
  return `${window.location.origin}/api`;
};

// ============================================================
// NORMALIZE ONE VOCABULARY ITEM
// ============================================================

const normalizeItem = (item = {}) => ({
  ...item,

  id:
    item.id?.toString() ||
    item.word?.toString().trim().toLowerCase(),

  word: item.word?.toString().trim() || "",

  hindiMeaning:
    item.hindiMeaning ??
    item.hindi_meaning ??
    item.meaning ??
    "",

  mnemonic: item.mnemonic ?? "",

  example: item.example ?? "",

  category:
    item.category?.toString().trim() ||
    "Vocabulary",

  difficulty:
    ["Easy", "Medium", "Hard"].includes(item.difficulty)
      ? item.difficulty
      : "Medium",

  status: item.status || "New",

  synonyms: Array.isArray(item.synonyms)
    ? item.synonyms
    : [],

  antonyms: Array.isArray(item.antonyms)
    ? item.antonyms
    : [],
});

// ============================================================
// NORMALIZE LIST
// ============================================================

const normalizeList = (data) =>
  Array.isArray(data)
    ? data
        .map(normalizeItem)
        .filter((item) => item.word)
    : [];

// ============================================================
// API REQUEST HELPER
// ============================================================

async function request(path, options = {}) {
  const apiBase = getApiBase();

  const response = await fetch(`${apiBase}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },

    credentials: "include",

    // Never allow browser cache for vocabulary API calls.
    cache: "no-store",
  });

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

// ============================================================
// MAIN HOOK
// ============================================================

export function useVocabularyData() {
  // IMPORTANT:
  // Master vocabulary NEVER comes from localStorage.
  // Neon database is the only source of truth.

  const [items, setItems] = useState([]);

  const [categoriesState, setCategoriesState] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ==========================================================
  // APPLY VOCABULARY
  // ==========================================================

  const applyItems = useCallback((data) => {
    const formatted = normalizeList(data);

    setItems(formatted);

    return formatted;
  }, []);

  // ==========================================================
  // APPLY CATEGORIES
  // ==========================================================

  const applyCategories = useCallback((data) => {
    const names = Array.isArray(data)
      ? data
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.name
          )
          .filter(Boolean)
      : [];

    const unique = Array.from(
      new Set(names)
    );

    setCategoriesState(unique);

    return unique;
  }, []);

  // ==========================================================
  // REFRESH VOCABULARY
  // ==========================================================

  const refreshVocabulary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await request(
        "/vocabulary"
      );

      if (!Array.isArray(data)) {
        throw new Error(
          "Vocabulary API returned an invalid response."
        );
      }

      return applyItems(data);
    } catch (err) {
      const message =
        err?.message ||
        "Unable to load vocabulary from database.";

      setError(message);
      setItems([]);

      return [];
    } finally {
      setLoading(false);
    }
  }, [applyItems]);

  // ==========================================================
  // REFRESH CATEGORIES
  // ==========================================================

  const refreshCategories = useCallback(async () => {
    try {
      const data = await request(
        "/categories"
      );

      return applyCategories(data);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load categories from database."
      );

      setCategoriesState([]);

      return [];
    }
  }, [applyCategories]);

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    // Remove old master-data caches created by previous versions.
    // Master vocabulary must NOT live in localStorage.

    removeKey(
      "shivam-blackbook-vocab-data"
    );

    removeKey(
      "shivam-blackbook-vocab-categories"
    );

    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      const [
        wordsResult,
        categoriesResult,
      ] = await Promise.allSettled([
        request("/vocabulary"),
        request("/categories"),
      ]);

      if (!active) {
        return;
      }

      // ------------------------------------------------------
      // Vocabulary
      // ------------------------------------------------------

      if (
        wordsResult.status === "fulfilled" &&
        Array.isArray(wordsResult.value)
      ) {
        applyItems(wordsResult.value);
      } else {
        setItems([]);

        setError(
          wordsResult.reason?.message ||
            "Unable to load vocabulary from the Neon database."
        );
      }

      // ------------------------------------------------------
      // Categories
      // ------------------------------------------------------

      if (
        categoriesResult.status === "fulfilled"
      ) {
        applyCategories(
          categoriesResult.value
        );
      }

      setLoading(false);
    };

    loadData();

    return () => {
      active = false;
    };
  }, [applyItems, applyCategories]);

  // ==========================================================
  // ADD VOCABULARY
  // ==========================================================

  const addVocabulary = useCallback(
    async (raw) => {
      const entry = normalizeItem(raw);

      if (!entry.word || !entry.hindiMeaning) {
        throw new Error(
          "Word and Hindi meaning are required."
        );
      }

      const data = await request(
        "/vocabulary",
        {
          method: "POST",

          body: JSON.stringify({
            id:
              entry.id ||
              `vocab-${Date.now()}`,

            word: entry.word,

            hindi_meaning:
              entry.hindiMeaning,

            mnemonic:
              entry.mnemonic,

            example:
              entry.example,

            category:
              entry.category,

            difficulty:
              entry.difficulty,

            status:
              entry.status,
          }),
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Vocabulary could not be saved."
        );
      }

      await refreshVocabulary();

      return entry;
    },
    [refreshVocabulary]
  );

  // ==========================================================
  // UPDATE VOCABULARY
  // ==========================================================

  const updateVocabulary = useCallback(
    async (raw) => {
      const entry = normalizeItem(raw);

      if (!entry.id) {
        throw new Error(
          "Vocabulary id is required."
        );
      }

      if (
        !entry.word ||
        !entry.hindiMeaning
      ) {
        throw new Error(
          "Word and Hindi meaning are required."
        );
      }

      const data = await request(
        "/vocabulary",
        {
          method: "PUT",

          body: JSON.stringify({
            id: entry.id,

            word: entry.word,

            hindi_meaning:
              entry.hindiMeaning,

            mnemonic:
              entry.mnemonic,

            example:
              entry.example,

            category:
              entry.category,

            difficulty:
              entry.difficulty,

            status:
              entry.status,
          }),
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Vocabulary update failed."
        );
      }

      await refreshVocabulary();

      return entry;
    },
    [refreshVocabulary]
  );

  // ==========================================================
  // DELETE VOCABULARY
  // ==========================================================

  const deleteVocabulary = useCallback(
    async (id) => {
      const cleanId =
        id?.toString().trim();

      if (!cleanId) {
        throw new Error(
          "Vocabulary id is required."
        );
      }

      // ------------------------------------------------------
      // DELETE EXACT DATABASE ROW
      // ------------------------------------------------------

      const data = await request(
        "/vocabulary",
        {
          method: "DELETE",

          body: JSON.stringify({
            id: cleanId,
          }),
        }
      );

      // ------------------------------------------------------
      // API MUST CONFIRM REAL DATABASE DELETION
      // ------------------------------------------------------

      if (
        !data?.success ||
        data?.deleted !== true
      ) {
        throw new Error(
          data?.error ||
            "Delete was not confirmed by the database."
        );
      }

      // ------------------------------------------------------
      // Safety check:
      // API should return the same ID we requested.
      // ------------------------------------------------------

      if (
        data.id?.toString() !==
        cleanId
      ) {
        throw new Error(
          "Delete verification failed: database returned a different vocabulary id."
        );
      }

      // ------------------------------------------------------
      // ONLY AFTER SUCCESSFUL DATABASE DELETE:
      // REFRESH THE MASTER LIST.
      // ------------------------------------------------------

      const refreshed =
        await refreshVocabulary();

      // ------------------------------------------------------
      // Verify deleted ID is no longer in API result.
      // ------------------------------------------------------

      const stillExists =
        refreshed.some(
          (item) =>
            item.id?.toString() ===
            cleanId
        );

      if (stillExists) {
        throw new Error(
          "Delete verification failed: the word is still present in the vocabulary API."
        );
      }

      return {
        success: true,
        deleted: true,
        id: cleanId,
        word: data.word || "",
      };
    },
    [refreshVocabulary]
  );

  // ==========================================================
  // ADD CATEGORY
  // ==========================================================

  const addCategory = useCallback(
    async (label) => {
      const clean =
        label?.toString().trim();

      if (!clean) {
        throw new Error(
          "Category name is required."
        );
      }

      const data = await request(
        "/categories",
        {
          method: "POST",

          body: JSON.stringify({
            name: clean,
          }),
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Category could not be added."
        );
      }

      return refreshCategories();
    },
    [refreshCategories]
  );

  // ==========================================================
  // REMOVE CATEGORY
  // ==========================================================

  const removeCategory = useCallback(
    async (label) => {
      const clean =
        label?.toString().trim();

      if (!clean) {
        throw new Error(
          "Category name is required."
        );
      }

      const data = await request(
        "/categories",
        {
          method: "DELETE",

          body: JSON.stringify({
            name: clean,
          }),
        }
      );

      if (!data?.success) {
        throw new Error(
          data?.error ||
            "Category could not be removed."
        );
      }

      return refreshCategories();
    },
    [refreshCategories]
  );

  // ==========================================================
  // CATEGORY LIST
  // ==========================================================

  const categories = useMemo(
    () => [
      "All",
      ...categoriesState.filter(
        (item) => item !== "All"
      ),
    ],
    [categoriesState]
  );

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    items,

    setItems,

    categories,

    rawCategories:
      categoriesState,

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