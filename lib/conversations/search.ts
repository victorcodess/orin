import Fuse from "fuse.js";
import { create } from "zustand";

import { conversationDisplayTitle } from "@/lib/conversations/title";
import type { SidebarConversation } from "@/lib/conversations/sidebar-conversation";

export type SearchableConversation = SidebarConversation & {
  displayTitle: string;
};

export const useSearchChatsStore = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
}));

export function isSearchChatsDialogOpen() {
  return useSearchChatsStore.getState().open;
}

export function openSearchChatsDialog() {
  useSearchChatsStore.getState().setOpen(true);
}

function toSearchableConversation(
  conversation: SidebarConversation,
): SearchableConversation {
  return {
    ...conversation,
    displayTitle: conversationDisplayTitle(conversation.title),
  };
}

export function buildConversationSearch(
  conversations: SidebarConversation[],
) {
  const items = conversations.map(toSearchableConversation);
  const fuse = new Fuse(items, {
    keys: ["displayTitle"],
    threshold: 0.35,
    ignoreLocation: true,
  });

  return (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return items;
    return fuse.search(trimmed).map((result) => result.item);
  };
}

const DAY_MS = 86_400_000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatConversationDate(
  isoDate: string,
  now = new Date(),
): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = startOfDay(now);
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / DAY_MS);

  if (diffDays === 0) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
