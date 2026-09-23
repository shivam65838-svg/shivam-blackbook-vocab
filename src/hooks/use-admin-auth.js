import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

const API_BASE =
  (typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_API_URL) ||
  (typeof window !== "undefined"
    ? `${window.location.origin}/api`
    : "https://shivam-blackbook-vocab.vercel.app/api");

export function useAdminAuth() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE}/admin`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (active) {
          setAuthenticated(Boolean(data.authenticated));
        }
      })
      .catch(() => {
        if (active) {
          setAuthenticated(false);
        }
      })
      .finally(() => {
        if (active) {
          setInitialized(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE}/admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return false;
      }

      setAuthenticated(Boolean(data.authenticated));

      return Boolean(data.authenticated);
    } catch (error) {
      console.error("Admin login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/admin`, {
        method: "DELETE",
        credentials: "include",
      });
    } finally {
      setAuthenticated(false);
      router.replace("/admin");
    }
  };

  return {
    authenticated,
    initialized,
    login,
    logout,
  };
}