"use client";

import { create } from "zustand";

import type { ConversationRow } from "@/lib/ai/conversations";
import { debugLog } from "@/lib/debug";
import { useAuthStore } from "@/lib/stores/auth-store";

type ConversationsState = {
  userId: string | null | undefined;
  conversations: ConversationRow[];
  isLoading: boolean;
  init: () => () => void;
  syncForUser: (userId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  renameConversation: (conversationId: string, title: string | null) => void;
  setFavorite: (conversationId: string, isFavorited: boolean) => void;
  removeConversation: (conversationId: string) => void;
  getConversation: (conversationId: string) => ConversationRow | undefined;
};

async function fetchConversations() {
  const response = await fetch("/api/conversations", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load conversations");
  }

  return (await response.json()) as ConversationRow[];
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  userId: undefined,
  conversations: [],
  isLoading: true,

  init: () => {
    const unsubscribeAuth = useAuthStore.subscribe((state, previousState) => {
      if (state.userId === previousState.userId) {
        return;
      }

      if (state.userId === undefined) {
        return;
      }

      void get().syncForUser(state.userId);
    });

    const { userId } = useAuthStore.getState();
    if (userId !== undefined) {
      void get().syncForUser(userId);
    }

    return unsubscribeAuth;
  },

  syncForUser: async (userId) => {
    if (userId === get().userId) {
      return;
    }

    set({ userId, conversations: [], isLoading: true });

    try {
      const conversations = await fetchConversations();
      debugLog("sidebar", "supabase conversations", conversations);

      if (get().userId === userId) {
        set({ conversations, isLoading: false });
      }
    } catch {
      if (get().userId === userId) {
        set({ isLoading: false });
      }
    }
  },

  refresh: async () => {
    const { userId } = get();
    if (userId === undefined) {
      return;
    }

    set({ isLoading: true });

    try {
      const conversations = await fetchConversations();
      set({ conversations, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  renameConversation: (conversationId, title) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title,
              updated_at: new Date().toISOString(),
            }
          : conversation
      ),
    }));
  },

  setFavorite: (conversationId, isFavorited) => {
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              is_favorited: isFavorited,
              updated_at: new Date().toISOString(),
            }
          : conversation
      ),
    }));
  },

  removeConversation: (conversationId) => {
    set((state) => ({
      conversations: state.conversations.filter(
        (conversation) => conversation.id !== conversationId
      ),
    }));
  },

  getConversation: (conversationId) => {
    return get().conversations.find(
      (conversation) => conversation.id === conversationId
    );
  },
}));

export function useSidebarConversations() {
  const conversations = useConversationsStore((state) => state.conversations);
  const isLoading = useConversationsStore((state) => state.isLoading);

  return { conversations, isLoading };
}

export function useConversation(conversationId: string) {
  return useConversationsStore((state) =>
    state.conversations.find((conversation) => conversation.id === conversationId)
  );
}
