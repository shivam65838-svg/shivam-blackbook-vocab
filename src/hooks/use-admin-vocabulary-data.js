import { useCallback, useEffect, useState } from "react";

import { getApiBase } from "@/utils/api";

const PAGE_SIZE = 50;

const normalizeItem = (item = {}) => ({
  ...item,
  id: item.id?.toString() || "",
  word: item.word?.toString().trim() || "",
  hindiMeaning: (item.hindiMeaning ?? item.hindi_meaning ?? "").toString().trim(),
  mnemonic: item.mnemonic?.toString() || "",
  example: item.example?.toString() || "",
  category: item.category?.toString().trim() || "Vocabulary",
  difficulty: item.difficulty?.toString() || "Medium",
  status: item.status?.toString() || "New",
});

const request = async (path, options = {}) => {
  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include",
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
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data;
};

const matchesFilters = (item, { search, category, difficulty }) => {
  const needle = search.trim().toLowerCase();
  const searchable = [item.word, item.hindiMeaning, item.mnemonic, item.example]
    .join(" ")
    .toLowerCase();
  return (
    (!needle || searchable.includes(needle)) &&
    (!category || category === "All" || item.category === category) &&
    (!difficulty || difficulty === "All" || item.difficulty === difficulty)
  );
};

export function useAdminVocabularyData({ page, search, category, difficulty }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rawCategories, setRawCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, categories: 0, difficulties: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      admin: "1",
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (search.trim()) params.set("search", search.trim());
    if (category && category !== "All") params.set("category", category);
    if (difficulty && difficulty !== "All") params.set("difficulty", difficulty);

    try {
      const data = await request(`/vocabulary?${params.toString()}`);
      setItems((data.items || []).map(normalizeItem));
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (requestError) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError(requestError?.message || "Unable to load vocabulary.");
    } finally {
      setLoading(false);
    }
  }, [category, difficulty, page, search]);

  const loadCategories = useCallback(async () => {
    const data = await request("/categories");
    setRawCategories(
      (Array.isArray(data) ? data : [])
        .map((item) => (typeof item === "string" ? item : item?.name))
        .filter(Boolean)
    );
  }, []);

  const loadStats = useCallback(async () => {
    const data = await request("/vocabulary?admin=1&stats=1");
    setStats(data);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([loadCategories(), loadStats()]).catch((requestError) => {
      if (active) setError(requestError?.message || "Unable to load admin data.");
    });
    return () => {
      active = false;
    };
  }, [loadCategories, loadStats]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const addVocabulary = useCallback(async (payload) => {
    const data = await request("/vocabulary", {
      method: "POST",
      body: JSON.stringify({
        id: payload.id,
        word: payload.word,
        hindi_meaning: payload.hindiMeaning,
        mnemonic: payload.mnemonic,
        example: payload.example,
        category: payload.category,
        difficulty: payload.difficulty,
        status: payload.status,
      }),
    });
    const item = normalizeItem(data.item);
    setTotal((current) => current + 1);
    setStats((current) => ({ ...current, total: current.total + 1 }));
    await loadStats();
    setItems((current) =>
      page === 1 && matchesFilters(item, { search, category, difficulty })
        ? [item, ...current].slice(0, PAGE_SIZE)
        : current
    );
    return item;
  }, [category, difficulty, loadStats, page, search]);

  const updateVocabulary = useCallback(async (payload) => {
    const data = await request("/vocabulary", {
      method: "PUT",
      body: JSON.stringify({
        id: payload.id,
        word: payload.word,
        hindi_meaning: payload.hindiMeaning,
        mnemonic: payload.mnemonic,
        example: payload.example,
        category: payload.category,
        difficulty: payload.difficulty,
        status: payload.status,
      }),
    });
    const item = normalizeItem(data.item);
    let removed = false;
    setItems((current) => {
      if (!matchesFilters(item, { search, category, difficulty })) {
        removed = current.some((existing) => existing.id === item.id);
        return current.filter((existing) => existing.id !== item.id);
      }
      return current.map((existing) => (existing.id === item.id ? item : existing));
    });
    if (removed) setTotal((current) => Math.max(0, current - 1));
    await loadStats();
    return item;
  }, [category, difficulty, loadStats, search]);

  const deleteVocabulary = useCallback(async (id) => {
    const data = await request("/vocabulary", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    setItems((current) => current.filter((item) => item.id !== id));
    setTotal((current) => Math.max(0, current - 1));
    setStats((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
    await loadStats();
    return data;
  }, [loadStats]);

  const bulkAddVocabulary = useCallback(async (payload) => {
    const data = await request("/vocabulary", {
      method: "POST",
      body: JSON.stringify({ items: payload }),
    });
    setTotal((current) => current + (data.imported || 0));
    setStats((current) => ({ ...current, total: current.total + (data.imported || 0) }));
    await loadStats();
    return data;
  }, [loadStats]);

  const bulkDeleteVocabulary = useCallback(async (ids) => {
    const data = await request("/vocabulary", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
    const deleted = new Set((data.deletedIds || ids).map((value) => value?.toString()));
    setItems((current) => current.filter((item) => !deleted.has(item.id)));
    setTotal((current) => Math.max(0, current - (data.deletedCount || 0)));
    setStats((current) => ({
      ...current,
      total: Math.max(0, current.total - (data.deletedCount || 0)),
    }));
    await loadStats();
    return data;
  }, [loadStats]);

  const deleteCategoryVocabulary = useCallback(async (categoryName) => {
    const data = await request("/vocabulary", {
      method: "DELETE",
      body: JSON.stringify({ category: categoryName }),
    });
    const deleted = new Set((data.deletedIds || []).map((value) => value?.toString()));
    setItems((current) => current.filter((item) => !deleted.has(item.id)));
    setTotal((current) => Math.max(0, current - (data.deletedCount || 0)));
    setStats((current) => ({
      ...current,
      total: Math.max(0, current.total - (data.deletedCount || 0)),
    }));
    await loadStats();
    return data;
  }, [loadStats]);

  const addCategory = useCallback(async (name) => {
    await request("/categories", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    await loadCategories();
  }, [loadCategories]);

  const removeCategory = useCallback(async (name) => {
    await request("/categories", {
      method: "DELETE",
      body: JSON.stringify({ name }),
    });
    setRawCategories((current) => current.filter((item) => item !== name));
  }, []);

  return {
    items,
    total,
    totalPages,
    pageSize: PAGE_SIZE,
    rawCategories,
    stats,
    loading,
    error,
    loadPage,
    addVocabulary,
    updateVocabulary,
    deleteVocabulary,
    bulkAddVocabulary,
    bulkDeleteVocabulary,
    deleteCategoryVocabulary,
    addCategory,
    removeCategory,
  };
}
