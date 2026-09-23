import { useCallback, useEffect, useMemo, useState } from "react";

import {
  emitStorageEvent,
  getLocalDateKey,
  readJson,
  shiftDateKey,
  STORAGE_KEYS,
  writeJson,
} from "@/utils/local-storage";

const DEFAULT_STATE = {
  dailyTarget: 30,
  completedToday: 0,
  lastResetDate: getLocalDateKey(),
  lastActivityDate: null,
  currentStreak: 0,
  longestStreak: 0,
  learnedIds: [],
  pendingIds: [],
  learnedTodayIds: [],
  weakIds: [],
};

const getId = (item) =>
  item?.id?.toString().trim() || item?.word?.toString().trim().toLowerCase() || "";

const normalizeProgress = (raw) => {
  const today = getLocalDateKey();
  const stored = raw && typeof raw === "object" ? raw : {};
  const lastResetDate =
    typeof stored.lastResetDate === "string" ? stored.lastResetDate : today;
  const isSameDay = lastResetDate === today;

  return {
    dailyTarget:
      typeof stored.dailyTarget === "number" && stored.dailyTarget > 0
        ? stored.dailyTarget
        : 30,
    completedToday: isSameDay ? Math.max(0, Number(stored.completedToday) || 0) : 0,
    lastResetDate: today,
    lastActivityDate:
      typeof stored.lastActivityDate === "string" ? stored.lastActivityDate : null,
    currentStreak: Math.max(0, Number(stored.currentStreak) || 0),
    longestStreak: Math.max(0, Number(stored.longestStreak) || 0),
    learnedIds: Array.from(
      new Set(Array.isArray(stored.learnedIds) ? stored.learnedIds.filter(Boolean) : [])
    ),
    pendingIds: Array.from(
      new Set(Array.isArray(stored.pendingIds) ? stored.pendingIds.filter(Boolean) : [])
    ),
    learnedTodayIds: isSameDay
      ? Array.from(new Set(Array.isArray(stored.learnedTodayIds) ? stored.learnedTodayIds.filter(Boolean) : []))
      : [],
    weakIds: Array.from(
      new Set(Array.isArray(stored.weakIds) ? stored.weakIds.filter(Boolean) : [])
    ),
  };
};

const persist = (next) => {
  writeJson(STORAGE_KEYS.progress, next);
  emitStorageEvent();
};

export function useVocabProgress() {
  const [progress, setProgress] = useState(() => normalizeProgress(readJson(STORAGE_KEYS.progress)));

  const sync = useCallback(() => {
    setProgress(normalizeProgress(readJson(STORAGE_KEYS.progress)));
  }, []);

  useEffect(() => {
    sync();
    const onUpdate = () => sync();
    window.addEventListener("vocab-storage-updated", onUpdate);
    window.addEventListener("vocab-progress-updated", onUpdate);
    return () => {
      window.removeEventListener("vocab-storage-updated", onUpdate);
      window.removeEventListener("vocab-progress-updated", onUpdate);
    };
  }, [sync]);

  const learnedIds = useMemo(() => new Set(progress.learnedIds), [progress.learnedIds]);
  const pendingIds = useMemo(() => new Set(progress.pendingIds), [progress.pendingIds]);
  const weakIds = useMemo(() => new Set(progress.weakIds), [progress.weakIds]);

  const getStatus = useCallback(
    (item) => {
      const id = getId(item);
      if (learnedIds.has(id)) return "Learned";
      if (pendingIds.has(id)) return "Pending";
      return "New";
    },
    [learnedIds, pendingIds]
  );

  const markLearned = useCallback((item) => {
    const id = getId(item);
    if (!id) return;

    const today = getLocalDateKey();
    const learnedToday = new Set(
      progress.lastResetDate === today ? progress.learnedTodayIds : []
    );
    const wasLearnedToday = learnedToday.has(id);
    learnedToday.add(id);

    let currentStreak = progress.currentStreak;
    let longestStreak = progress.longestStreak;
    if (!wasLearnedToday) {
      if (progress.lastActivityDate === today) {
        currentStreak = Math.max(1, currentStreak);
      } else if (progress.lastActivityDate === shiftDateKey(today, -1)) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
    }

    const updated = {
      ...progress,
      lastResetDate: today,
      lastActivityDate: today,
      currentStreak,
      longestStreak,
      learnedIds: Array.from(new Set([...progress.learnedIds, id])),
      pendingIds: progress.pendingIds.filter((x) => x !== id),
      learnedTodayIds: Array.from(learnedToday),
      completedToday: wasLearnedToday
        ? progress.completedToday
        : progress.completedToday + 1,
    };

    setProgress(updated);
    persist(updated);
  }, [progress]);

  const markPending = useCallback((item) => {
    const id = getId(item);
    if (!id) return;

    const today = getLocalDateKey();
    const learnedToday = new Set(
      progress.lastResetDate === today ? progress.learnedTodayIds : []
    );
    const wasLearnedToday = learnedToday.delete(id);
    const updated = {
      ...progress,
      lastResetDate: today,
      pendingIds: Array.from(new Set([...progress.pendingIds, id])),
      learnedIds: progress.learnedIds.filter((x) => x !== id),
      learnedTodayIds: Array.from(learnedToday),
      completedToday: wasLearnedToday
        ? Math.max(progress.completedToday - 1, 0)
        : progress.completedToday,
    };

    setProgress(updated);
    persist(updated);
  }, [progress]);

  const setDailyTarget = useCallback((value) => {
    const updated = {
      ...progress,
      dailyTarget: Math.min(200, Math.max(5, Number(value) || 30)),
    };
    setProgress(updated);
    persist(updated);
  }, [progress]);

  const markQuizWrong = useCallback((ids) => {
    const validIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
    if (!validIds.length) return;

    const updated = {
      ...progress,
      weakIds: Array.from(new Set([...progress.weakIds, ...validIds])),
    };
    setProgress(updated);
    persist(updated);
  }, [progress]);

  const clearWeakWord = useCallback((id) => {
    const updated = {
      ...progress,
      weakIds: progress.weakIds.filter((x) => x !== id),
    };
    setProgress(updated);
    persist(updated);
  }, [progress]);

  return {
    ...progress,
    learnedCount: learnedIds.size,
    pendingCount: pendingIds.size,
    weakCount: weakIds.size,
    remainingToday: Math.max(progress.dailyTarget - progress.completedToday, 0),
    completionRate:
      progress.dailyTarget > 0
        ? Math.min(Math.max(progress.completedToday / progress.dailyTarget, 0), 1)
        : 0,
    learnedIds,
    pendingIds,
    weakIds,
    getStatus,
    markLearned,
    markPending,
    setDailyTarget,
    markQuizWrong,
    clearWeakWord,
  };
}
