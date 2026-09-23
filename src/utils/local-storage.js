export const STORAGE_KEYS = {
  progress: "shivam-blackbook-vocab-progress",
  quizHistory: "shivam-blackbook-vocab-quiz-history",
  settings: "shivam-blackbook-vocab-settings",
};

export const isStorageAvailable = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const readJson = (key, fallback = null) => {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJson = (key, value) => {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const removeKey = (key) => {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
};

export const emitStorageEvent = (name = "vocab-storage-updated") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
};

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const shiftDateKey = (dateKey, days) => {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
};
