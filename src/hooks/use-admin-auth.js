import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

const STORAGE_KEY = "shivam-blackbook-admin-auth";
const ADMIN_USERNAME = "Shivam";
const ADMIN_PASSWORD = "ChangeMe123";

const hasLocalStorage =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function readAuthFlag() {
  if (!hasLocalStorage) {
    return false;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeAuthFlag(value) {
  if (!hasLocalStorage) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    // ignore write failures
  }
}

export function useAdminAuth() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setAuthenticated(readAuthFlag());
    setInitialized(true);
  }, []);

  const login = (username, password) => {
    const validUsername = username?.trim() === ADMIN_USERNAME;
    const validPassword = password === ADMIN_PASSWORD;

    if (validUsername && validPassword) {
      writeAuthFlag(true);
      setAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    writeAuthFlag(false);
    setAuthenticated(false);
    router.replace("/admin");
  };

  return {
    authenticated,
    initialized,
    login,
    logout,
    ADMIN_USERNAME,
  };
}
