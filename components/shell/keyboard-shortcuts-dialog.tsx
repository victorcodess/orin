"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  enterLabel,
  escapeLabel,
  primaryModifierLabel,
  shiftLabel,
} from "@/lib/ui/keyboard-shortcuts";
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
        ...(process.env.NODE_ENV === "development"
          ? [
              {
                label: "Toggle message bubble layout",
                keys: [shift, modifier, "M"],
              },
            ]
          : []),
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
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex! h-[min(600px,85vh)] w-full max-w-md flex-col gap-0 overflow-hidden p-0 outline-none bg-background text-foreground",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6 pb-0.5">
          <DialogTitle
            id="keyboard-shortcuts-title"
            className="font-sans text-lg font-semibold text-foreground"
          >
            Keyboard shortcuts
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Close keyboard shortcuts"
            className="hover:bg-accent hover:dark:bg-muted -mt-0.5 shrink-0"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-4"
            />
          </Button>
        </div>
        <DialogDescription className="sr-only">
          Keyboard shortcuts for Orin
        </DialogDescription>
        <div className="relative min-h-0 flex-1">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-linear-to-b from-background to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-linear-to-t from-background to-transparent"
          />
          <div className="absolute inset-0 overflow-y-auto px-6 pb-6 pt-4">
            <ShortcutSectionList sections={sections} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
