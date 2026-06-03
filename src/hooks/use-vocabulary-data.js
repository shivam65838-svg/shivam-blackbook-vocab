import { useEffect, useMemo, useState } from "react";


const STORAGE_KEY = "shivam-blackbook-vocab-data";
const CATEGORIES_KEY = "shivam-blackbook-categories";
const hasLocalStorage =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const DEFAULT_CATEGORIES = [
  "Vocabulary",
  "One Word Substitution",
  "Idioms",
  "Phrases",
  "Synonyms",
  "Antonyms",
];

function normalizeCategory(category) {
  const raw = (category || "").toString().trim();

  if (/one\s*word\s*substitution/i.test(raw)) {
    return "One Word Substitution";
  }
  if (/idioms?/i.test(raw) && /phrases?/i.test(raw)) {
    return "Idioms";
  }
  if (/idioms?/i.test(raw)) {
    return "Idioms";
  }
  if (/phrases?/i.test(raw)) {
    return "Phrases";
  }
  if (/synonyms?/i.test(raw)) {
    return "Synonyms";
  }
  if (/antonyms?/i.test(raw)) {
    return "Antonyms";
  }

  return raw || "Words";
}

function loadSavedVocabulary() {
  if (!hasLocalStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map((item) => ({
      ...item,
      category: normalizeCategory(item.category),
      id: item.id?.toString() || `${item.word?.toString().toLowerCase()}-${Date.now()}`,
    }));
  } catch {
    return null;
  }
}

function saveVocabulary(items) {
  if (!hasLocalStorage) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore write failures
  }
}

function loadSavedCategories() {
  if (!hasLocalStorage) return null;
  try {
    const raw = window.localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((c) => c.toString());
  } catch {
    return null;
  }
}

function saveCategories(categories) {
  if (!hasLocalStorage) return;
  try {
    window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch {
    // ignore
  }
}

function buildEntry(raw) {
  return {
    id: raw.id?.toString() || `word-${Date.now()}`,
    word: raw.word?.toString().trim() || "",
    hindiMeaning: raw.hindiMeaning?.toString().trim() || "",
    example: raw.example?.toString().trim() || "",
    mnemonic: raw.mnemonic?.toString().trim() || "",
    category: normalizeCategory(raw.category),
    difficulty: raw.difficulty || "Medium",
    status: raw.status || "New",
  };
}

export function useVocabularyData() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function loadWords() {
      try {
        const response = await fetch(
          "https://vocab-api-seven.vercel.app/api/vocabulary"
        );

        const data = await response.json();

        const formatted = data.map((item) => ({
          ...item,
          hindiMeaning: item.hindi_meaning,
          category: item.category || "Vocabulary",
          difficulty: item.difficulty || "Medium",
          status: item.status || "New",
        }));

        console.log("DATABASE VOCAB =", formatted.length);

        setItems(formatted);
      } catch (error) {
        console.error("VOCAB LOAD ERROR =", error);
      }
    }

    loadWords();
  }, []);
  const [categoriesState, setCategoriesState] = useState(() => {
    const saved = loadSavedCategories();
    if (saved && saved.length > 0) return saved;
    return DEFAULT_CATEGORIES;
  });
  const [initialized] = useState(true);

  

  

  useEffect(() => {
    saveCategories(categoriesState);
  }, [categoriesState]);

  const addVocabulary = (raw) => {
    const entry = buildEntry(raw);
    setItems((prev) => [entry, ...prev]);
  };

  const updateVocabulary = (raw) => {
    const entry = buildEntry(raw);
    setItems((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, ...entry } : item))
    );
  };

  const deleteVocabulary = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addCategory = (label) => {
    const clean = (label || "").toString().trim();
    if (!clean) return;
    setCategoriesState((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  };

  const removeCategory = (label) => {
    setCategoriesState((prev) => prev.filter((c) => c !== label));
    // Optionally, items in removed category will remain unchanged.
  };
  const categories = useMemo(() => ["All", ...categoriesState], [categoriesState]);

  return {
    items,
    categories,
    rawCategories: categoriesState,
    addCategory,
    removeCategory,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
    initialized,
  };
}
