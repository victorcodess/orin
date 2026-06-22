"use client";

import { create } from "zustand";

import {
  type SidebarConversation,
  toSidebarConversation,
} from "@/lib/conversations/sidebar-conversation";
import { debugLog } from "@/lib/debug";
import { useAuthStore } from "@/lib/stores/auth-store";

type ConversationsState = {
  userId: string | null | undefined;
  conversations: SidebarConversation[];
  deletedConversationIds: Set<string>;
  isLoading: boolean;
  init: () => () => void;
  syncForUser: (userId: string | null) => Promise<void>;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  prependConversation: (conversation: SidebarConversation) => void;
  renameConversation: (conversationId: string, title: string | null) => void;
  setFavorite: (conversationId: string, isFavorited: boolean) => void;
  removeConversation: (conversationId: string) => void;
  undoConversationDelete: (conversationId: string) => void;
  getConversation: (conversationId: string) => SidebarConversation | undefined;
};

function withoutDeletedConversations(
  conversations: SidebarConversation[],
  deletedConversationIds: Set<string>
) {
  if (deletedConversationIds.size === 0) {
    return conversations;
  }

  return conversations.filter(
    (conversation) => !deletedConversationIds.has(conversation.id)
  );
}

async function fetchConversations() {
  const response = await fetch("/api/conversations", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load conversations");
  }

  const rows = (await response.json()) as Parameters<
    typeof toSidebarConversation
  >[0][];

  return rows.map(toSidebarConversation);
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  userId: undefined,
  conversations: [],
  deletedConversationIds: new Set(),
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

    set({ userId, conversations: [], deletedConversationIds: new Set(), isLoading: true });

    try {
      const conversations = await fetchConversations();
      debugLog("sidebar", "conversations", conversations);

      if (get().userId === userId) {
        set({
          conversations: withoutDeletedConversations(
            conversations,
            get().deletedConversationIds
          ),
          isLoading: false,
        });
      }
    } catch {
      if (get().userId === userId) {
        set({ isLoading: false });
      }
    }
  },

  refresh: async (options) => {
    const { userId } = get();
    if (userId === undefined) {
      return;
    }

    if (!options?.silent) {
      set({ isLoading: true });
    }

    try {
      const conversations = await fetchConversations();
      set({
        conversations: withoutDeletedConversations(
          conversations,
          get().deletedConversationIds
        ),
        isLoading: false,
      });
    } catch {
      if (!options?.silent) {
        set({ isLoading: false });
      }
    }
  },

  prependConversation: (conversation) => {
    set((state) => {
      if (state.deletedConversationIds.has(conversation.id)) {
        return state;
      }

      return {
        conversations: [
          conversation,
          ...state.conversations.filter((item) => item.id !== conversation.id),
        ],
      };
    });
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
      deletedConversationIds: new Set(state.deletedConversationIds).add(
        conversationId
      ),
      conversations: state.conversations.filter(
        (conversation) => conversation.id !== conversationId
      ),
    }));
  },

  undoConversationDelete: (conversationId) => {
    set((state) => {
      const deletedConversationIds = new Set(state.deletedConversationIds);
      deletedConversationIds.delete(conversationId);
      return { deletedConversationIds };
    });
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
