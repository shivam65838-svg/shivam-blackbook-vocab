import { useEffect, useMemo, useRef, useState } from "react";

import { useVocabularyData } from "@/hooks/use-vocabulary-data";

const STORAGE_KEY = "shivam-blackbook-vocab-progress";

const isLocalStorageAvailable = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readStorage = () => {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStorage = (value) => {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures.
  }
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getId = (item) => item?.id?.toString() || item?.word?.toString() || "";

const normalizeProgress = (raw) => {
  const today = getTodayKey();
  const stored = raw && typeof raw === "object" ? raw : {};

  const dailyTarget =
    typeof stored.dailyTarget === "number" ? stored.dailyTarget : 30;
  const learnedIds = Array.isArray(stored.learnedIds)
    ? stored.learnedIds.filter((id) => typeof id === "string")
    : [];
  const pendingIds = Array.isArray(stored.pendingIds)
    ? stored.pendingIds.filter((id) => typeof id === "string")
    : [];
  const lastResetDate =
    typeof stored.lastResetDate === "string" ? stored.lastResetDate : today;
  const completedToday =
    lastResetDate === today ? Number(stored.completedToday) || 0 : 0;

  return {
    dailyTarget,
    completedToday,
    lastResetDate: today,
    learnedIds: Array.from(new Set(learnedIds)),
    pendingIds: Array.from(new Set(pendingIds)),
  };
};

const DEFAULT_STATE = {
  dailyTarget: 30,
  completedToday: 0,
  lastResetDate: getTodayKey(),
  learnedIds: [],
  pendingIds: [],
};

export function useVocabProgress() {
  const [progress, setProgress] = useState(DEFAULT_STATE);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    const stored = readStorage();
    setProgress(normalizeProgress(stored));
    hasHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    writeStorage(progress);
  }, [progress]);

  const learnedIds = useMemo(
    () => new Set(progress.learnedIds),
    [progress.learnedIds],
  );
  const pendingIds = useMemo(
    () => new Set(progress.pendingIds),
    [progress.pendingIds],
  );

  const { items: vocabulary } = useVocabularyData();
  const totalWords = vocabulary.length;
  const learnedCount = learnedIds.size;
  const pendingCount = pendingIds.size;
  const remainingToday = Math.max(
    progress.dailyTarget - progress.completedToday,
    0,
  );
  const completionRate =
    progress.dailyTarget > 0
      ? Math.min(Math.max(progress.completedToday / progress.dailyTarget, 0), 1)
      : 0;

  const getStatus = (item) => {
    if (!item) return "New";
    if (item.status) return item.status;
    const id = getId(item);
    if (learnedIds.has(id)) {
      return "Learned";
    }

    if (pendingIds.has(id)) {
      return "Pending";
    }

    return "New";
  };

  const markLearned = (item) => {
    const id = getId(item);
    if (!id) {
      return;
    }

    setProgress((current) => {
      if (current.learnedIds.includes(id)) {
        return current;
      }

      const today = getTodayKey();
      const nextCompletedToday =
        current.lastResetDate === today ? current.completedToday + 1 : 1;

      return {
        ...current,
        learnedIds: [...current.learnedIds, id],
        pendingIds: current.pendingIds.filter((itemId) => itemId !== id),
        completedToday: nextCompletedToday,
        lastResetDate: today,
      };
    });
  };

  const markPending = (item) => {
    const id = getId(item);
    if (!id) {
      return;
    }

    setProgress((current) => {
      if (current.pendingIds.includes(id)) {
        return current;
      }

      return {
        ...current,
        pendingIds: [...current.pendingIds, id],
      };
    });
  };

  const setDailyTarget = (value) => {
    setProgress((current) => ({
      ...current,
      dailyTarget: Number(value) || 30,
    }));
  };

  return {
    ...progress,
    totalWords,
    learnedCount,
    pendingCount,
    remainingToday,
    completionRate,
    getStatus,
    markLearned,
    markPending,
    setDailyTarget,
  };
}
