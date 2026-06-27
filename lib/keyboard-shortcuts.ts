import { create } from "zustand";

export function hasPrimaryModifier(
  event: KeyboardEvent | { metaKey: boolean; ctrlKey: boolean },
) {
  return event.metaKey || event.ctrlKey;
}

export const useKeyboardShortcutsStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function isKeyboardShortcutsDialogOpen() {
  return useKeyboardShortcutsStore.getState().open;
}

export { isSettingsPanelOpen } from "@/lib/settings-routes";

type ShortcutMatchOptions = {
  shift?: boolean;
  alt?: boolean;
  modifier?: boolean;
};

export function matchesShortcut(
  event: KeyboardEvent,
  key: string,
  options: ShortcutMatchOptions = {},
) {
  const wantsModifier = options.modifier ?? true;
  const wantsShift = options.shift ?? false;
  const wantsAlt = options.alt ?? false;

  if (wantsModifier && !hasPrimaryModifier(event)) {
    return false;
  }

  if (!wantsModifier && hasPrimaryModifier(event)) {
    return false;
  }

  if (event.shiftKey !== wantsShift) {
    return false;
  }

  if (event.altKey !== wantsAlt) {
    return false;
  }

  const normalizedKey = key.toLowerCase();
  return (
    event.key.toLowerCase() === normalizedKey ||
    event.code === `Key${key.toUpperCase()}`
  );
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

export function isPlainEscape(event: KeyboardEvent) {
  return (
    event.key === "Escape" &&
    !event.shiftKey &&
    !hasPrimaryModifier(event) &&
    !event.altKey
  );
}
