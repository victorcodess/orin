"use client";

import { useEffect } from "react";

import { useThemePreference } from "@/lib/hooks/use-theme-preference";
import {
  isKeyboardShortcutsDialogOpen,
  matchesShortcut,
} from "@/lib/ui/keyboard-shortcuts";

export function ThemeKeyboardShortcut() {
  const { toggleLightDark } = useThemePreference();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isKeyboardShortcutsDialogOpen()) {
        return;
      }

      if (matchesShortcut(event, "l", { shift: true })) {
        event.preventDefault();
        toggleLightDark();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [toggleLightDark]);

  return null;
}
