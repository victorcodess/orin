"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";

import { toast } from "@/components/nexus-ui/toaster";
import type { ThemePreference } from "@/lib/orin/user-preferences";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useProfileStore } from "@/lib/stores/profile-store";

export function useThemePreference() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const setThemePreference = useCallback(
    (value: ThemePreference) => {
      setTheme(value);

      const userId = useAuthStore.getState().userId;
      if (!userId) {
        return;
      }

      void useProfileStore
        .getState()
        .patch({ theme: value })
        .then((updated) => {
          if (!updated) {
            toast.error("Couldn't save theme");
          }
        });
    },
    [setTheme],
  );

  const toggleLightDark = useCallback(() => {
    setThemePreference(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setThemePreference]);

  return {
    theme,
    resolvedTheme,
    setThemePreference,
    toggleLightDark,
  };
}
