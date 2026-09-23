import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

const API_BASE =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL) ||
  "https://vocab-api-seven.vercel.app/api";

export function useAdminAuth() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/admin`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      })
      .finally(() => {
        if (active) setInitialized(true);
      });
    return () => { active = false; };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE}/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) return false;
      setAuthenticated(Boolean(data.authenticated));
      return Boolean(data.authenticated);
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/admin`, { method: "DELETE", credentials: "include" });
    } finally {
      setAuthenticated(false);
      router.replace("/admin");
    }
  };

  return { authenticated, initialized, login, logout };
}
