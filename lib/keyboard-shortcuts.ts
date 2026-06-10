export function hasPrimaryModifier(
  event: KeyboardEvent | { metaKey: boolean; ctrlKey: boolean },
) {
  return event.metaKey || event.ctrlKey;
}

export function isMacPlatform() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
}

export function primaryModifierLabel() {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

export function shiftLabel() {
  return isMacPlatform() ? "⇧" : "Shift";
}

export function enterLabel() {
  return isMacPlatform() ? "↵" : "Enter";
}

export function escapeLabel() {
  return "Esc";
}

export const KEYBOARD_SHORTCUTS_OPEN_EVENT = "orin:open-keyboard-shortcuts";

export function openKeyboardShortcutsDialog() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(KEYBOARD_SHORTCUTS_OPEN_EVENT));
  }
}
