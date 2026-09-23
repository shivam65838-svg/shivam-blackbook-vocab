import { getApiBase } from "@/utils/api";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

export function useAdminAuth() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;

    fetch(`${getApiBase()}/admin`, {
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
      const response = await fetch(`${getApiBase()}/admin`, {
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
      await fetch(`${getApiBase()}/admin`, {
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