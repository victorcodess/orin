"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { KeyboardShortcutsDialog } from "@/components/orin/keyboard-shortcuts-dialog";
import {
  hasPrimaryModifier,
  KEYBOARD_SHORTCUTS_OPEN_EVENT,
} from "@/lib/keyboard-shortcuts";

export function AppKeyboardShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);

    window.addEventListener(KEYBOARD_SHORTCUTS_OPEN_EVENT, handleOpen);
    return () =>
      window.removeEventListener(KEYBOARD_SHORTCUTS_OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hasPrimaryModifier(event)) {
        return;
      }

      if (event.key === "/" && !event.shiftKey && !event.altKey) {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (
        event.shiftKey &&
        !event.altKey &&
        (event.key === "," || event.code === "Comma")
      ) {
        event.preventDefault();
        router.push("/settings");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return <KeyboardShortcutsDialog open={open} onOpenChange={setOpen} />;
}

export function isKeyboardShortcutsDialogOpen() {
  return Boolean(
    document.querySelector('[data-slot="keyboard-shortcuts-dialog"]'),
  );
}
