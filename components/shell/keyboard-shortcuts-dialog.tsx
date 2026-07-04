"use client";

import { useEffect } from "react";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  enterLabel,
  escapeLabel,
  primaryModifierLabel,
  shiftLabel,
} from "@/lib/keyboard-shortcuts";
import { cn } from "@/lib/utils";

type KeyboardShortcutsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ShortcutRow = {
  label: string;
  keys: string[];
};

type ShortcutSection = {
  title: string;
  shortcuts: ShortcutRow[];
};

function ShortcutKeys({ keys }: { keys: string[] }) {
  return (
    <KbdGroup className="ml-auto shrink-0">
      {keys.map((key, index) => (
        <Kbd key={`${key}-${index}`}>{key}</Kbd>
      ))}
    </KbdGroup>
  );
}

function ShortcutSectionList({ sections }: { sections: ShortcutSection[] }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.title} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-foreground">{section.title}</h3>
          <ul className="flex flex-col gap-1">
            {section.shortcuts.map((shortcut) => (
              <li
                key={shortcut.label}
                className="flex items-center justify-between gap-4 rounded-md px-1 py-1.5 text-sm text-muted-foreground"
              >
                <span>{shortcut.label}</span>
                <ShortcutKeys keys={shortcut.keys} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const modifier = primaryModifierLabel();
  const shift = shiftLabel();

  const sections: ShortcutSection[] = [
    {
      title: "General",
      shortcuts: [
        { label: "New chat", keys: [shift, modifier, "O"] },
        { label: "Search chats", keys: [modifier, "K"] },
        { label: "Toggle sidebar", keys: [modifier, "B"] },
        { label: "Toggle theme", keys: [shift, modifier, "L"] },
        { label: "Keyboard shortcuts", keys: [modifier, "/"] },
        { label: "Settings", keys: [shift, modifier, ","] },
      ],
    },
    {
      title: "In chats",
      shortcuts: [
        { label: "Send message", keys: [enterLabel()] },
        { label: "New line in message", keys: [shift, enterLabel()] },
        { label: "Stop response", keys: [escapeLabel()] },
        {
          label: "Toggle dictation",
          keys: [shift, modifier, "D"],
        },
        { label: "Complete dictation", keys: [enterLabel()] },
      ],
    },
    {
      title: "Voice call",
      shortcuts: [
        { label: "Start voice call", keys: [shift, modifier, "C"] },
        { label: "Toggle microphone", keys: [shift, modifier, "M"] },
        { label: "Toggle call mode", keys: [shift, modifier, "E"] },
        { label: "End call", keys: [escapeLabel()] },
      ],
    },
    ...(process.env.NODE_ENV === "development"
      ? [
          {
            title: "Developer",
            shortcuts: [
              {
                label: "Toggle message bubble layout",
                keys: [shift, modifier, "M"],
              },
            ],
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        data-slot="keyboard-shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-border bg-background p-6 shadow-lg",
        )}
      >
        <h2
          id="keyboard-shortcuts-title"
          className="mb-6 text-lg font-semibold text-foreground"
        >
          Keyboard shortcuts
        </h2>
        <ShortcutSectionList sections={sections} />
      </div>
    </>
  );
}
