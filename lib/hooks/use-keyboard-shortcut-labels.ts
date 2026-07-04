import { useSyncExternalStore } from "react";

import { isMacPlatform } from "@/lib/ui/keyboard-shortcuts";

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
