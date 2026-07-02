"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { signalNewChat } from "@/components/chat/new-chat-view";
import { KeyboardShortcutsDialog } from "@/components/shell/keyboard-shortcuts-dialog";
import {
  hasPrimaryModifier,
  isKeyboardShortcutsDialogOpen,
  isPlainEscape,
  isSettingsPanelOpen,
  KEYBOARD_SHORTCUTS_OPEN_EVENT,
  matchesShortcut,
  useKeyboardShortcutsStore,
} from "@/lib/keyboard-shortcuts";
import { closeSettings, openSettings } from "@/lib/settings-routes";
import { useMessageStyleStore } from "@/lib/stores/message-style-store";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";

export function AppKeyboardShortcuts() {
  const router = useRouter();
  const open = useKeyboardShortcutsStore((state) => state.open);
  const setOpen = useKeyboardShortcutsStore((state) => state.setOpen);

  useEffect(() => {
    const handleOpen = () => setOpen(true);

    window.addEventListener(KEYBOARD_SHORTCUTS_OPEN_EVENT, handleOpen);
    return () =>
      window.removeEventListener(KEYBOARD_SHORTCUTS_OPEN_EVENT, handleOpen);
  }, [setOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const settingsOpen = isSettingsPanelOpen();
      const shortcutsDialogOpen = isKeyboardShortcutsDialogOpen();

      if (isPlainEscape(event)) {
        if (settingsOpen) {
          event.preventDefault();
          event.stopPropagation();
          closeSettings();
        }
        return;
      }

      if (shortcutsDialogOpen) {
        return;
      }

      if (settingsOpen) {
        return;
      }

      if (
        matchesShortcut(event, "o", { shift: true }) &&
        !event.altKey
      ) {
        event.preventDefault();
        signalNewChat();
        router.push("/new");
        return;
      }

      if (!hasPrimaryModifier(event)) {
        return;
      }

      if (event.key === "/" && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        setOpen(!open);
        return;
      }

      if (
        event.shiftKey &&
        !event.altKey &&
        (event.key === "," || event.code === "Comma")
      ) {
        event.preventDefault();
        openSettings("general");
        return;
      }

      if (
        process.env.NODE_ENV === "development" &&
        matchesShortcut(event, "m", { shift: true }) &&
        !event.altKey &&
        useVoiceCallStore.getState().status === "idle"
      ) {
        event.preventDefault();
        useMessageStyleStore.getState().toggleLayout();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, router, setOpen]);

  return <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />;
}
