import { useEffect, useMemo, useState } from "react";


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
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(value)
    );
  } catch {
    // Ignore storage failures.
  }
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getId = (item) =>
  item?.word?.toString().trim().toLowerCase() || "";

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
  

  useEffect(() => {
  const stored = readStorage();
  setProgress(normalizeProgress(stored));
  
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;

  const syncProgress = () => {
    const stored = readStorage();

    if (stored) {
      setProgress(normalizeProgress(stored));
    }
  };

  window.addEventListener(
    "vocab-progress-updated",
    syncProgress
  );

  return () => {
    window.removeEventListener(
      "vocab-progress-updated",
      syncProgress
    );
  };
}, []);


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
  const id = getId(item);

  

  if (learnedIds.has(id)) return "Learned";

  if (pendingIds.has(id)) return "Pending";

  return "New";
};

const markLearned = (item) => {
  const id = getId(item);

  if (!id) return;

  setProgress((current) => {
    const alreadyLearned =
      current.learnedIds.includes(id);

    const updated = {
      ...current,
      learnedIds: [
        ...new Set([...current.learnedIds, id]),
      ],
      pendingIds: current.pendingIds.filter(
        (x) => x !== id
      ),
      completedToday: alreadyLearned
        ? current.completedToday
        : current.completedToday + 1,
    };

    writeStorage(updated);

    window.dispatchEvent(
      new CustomEvent("vocab-progress-updated")
    );

    return updated;
  });
};
const markPending = (item) => {
  const id = getId(item);

  if (!id) return;

  setProgress((current) => {
    const wasLearned =
      current.learnedIds.includes(id);

    const updated = {
      ...current,
      pendingIds: [
        ...new Set([...current.pendingIds, id]),
      ],
      learnedIds: current.learnedIds.filter(
        (x) => x !== id
      ),
      completedToday: wasLearned
        ? Math.max(current.completedToday - 1, 0)
        : current.completedToday,
    };

    writeStorage(updated);

    window.dispatchEvent(
      new CustomEvent("vocab-progress-updated")
    );

    return updated;
  });
};
    

  const setDailyTarget = (value) => {
  setProgress((current) => {
    const updated = {
      ...current,
      dailyTarget: Number(value) || 30,
    };

    writeStorage(updated);

    window.dispatchEvent(
      new CustomEvent("vocab-progress-updated")
    );

    return updated;
  });
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



















