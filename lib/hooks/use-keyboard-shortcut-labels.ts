import { useSyncExternalStore } from "react";

import { isMacPlatform } from "@/lib/keyboard-shortcuts";

function getModifierLabel() {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

function getShiftLabel() {
  return isMacPlatform() ? "⇧" : "Shift";
}

export function useKeyboardShortcutLabels() {
  const modifier = useSyncExternalStore(
    () => () => {},
    getModifierLabel,
    () => "Ctrl",
  );
  const shift = useSyncExternalStore(
    () => () => {},
    getShiftLabel,
    () => "Shift",
  );

  return { modifier, shift };
}
