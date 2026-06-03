import { useEffect, useMemo, useRef, useState } from "react";


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

  const [totalWords, setTotalWords] = useState(0);

useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(
      "shivam-blackbook-vocab-data"
    );

    if (raw) {
  const items = JSON.parse(raw);

  console.log("LOCAL STORAGE COUNT =", items.length);

  setTotalWords(items.length);
}
  } catch (error) {
    console.log(error);
  }
}, []);
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
  return item?.status || "New";
};

  const markLearned = async (item) => {
  const id = getId(item);

  if (!id) return;

  try {
    await fetch(
      "https://vocab-api-seven.vercel.app/api/vocabulary",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: "Learned",
        }),
      }
    );

    window.location.reload();
  } catch (error) {
    console.error(error);
  }
};

    

  const markPending = async (item) => {
  const id = getId(item);

  if (!id) return;

  try {
    await fetch(
      "https://vocab-api-seven.vercel.app/api/vocabulary",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          status: "Pending",
        }),
      }
    );

    window.location.reload();
  } catch (error) {
    console.error(error);
  }
};

  const setDailyTarget = (value) => {
    setProgress((current) => ({
      ...current,
      dailyTarget: Number(value) || 30,
    }));
  };
console.log("TOTAL WORDS STATE =", totalWords);


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
  learnedIds: progress.learnedIds,
  pendingIds: progress.pendingIds,
};
}



















