"use client";

import { useQuery } from "@tanstack/react-query";

import {
  type SidebarConversation,
  toSidebarConversation,
} from "@/lib/conversations/sidebar-conversation";
import { debugLog } from "@/lib/debug";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/lib/stores/auth-store";

async function fetchConversations(): Promise<SidebarConversation[]> {
  const response = await fetch("/api/conversations", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load conversations");
  const rows = (await response.json()) as Parameters<
    typeof toSidebarConversation
  >[0][];
  const conversations = rows.map(toSidebarConversation);
  debugLog("sidebar", "conversations", conversations);
  return conversations;
}

// ---------------------------------------------------------------------------
// Cache helpers — safe to call outside of React hooks via getQueryClient().
// ---------------------------------------------------------------------------

/** Prepend a conversation to the top of the cached list (e.g. new chat). */
export function prependConversation(conversation: SidebarConversation) {
  getQueryClient().setQueryData<SidebarConversation[]>(
    queryKeys.conversations(),
    (old) => {
      if (!old) return [conversation];
      if (old.some((c) => c.id === conversation.id)) return old;
      return [conversation, ...old];
    },
  );
}

/** Optimistically rename a conversation in the cached list. */
export function renameConversationOptimistic(
  id: string,
  title: string | null,
) {
  getQueryClient().setQueryData<SidebarConversation[]>(
    queryKeys.conversations(),
    (old) =>
      old?.map((c) =>
        c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c,
      ),
  );
}

/** Optimistically toggle a conversation's favorite state. */
export function setConversationFavoriteOptimistic(
  id: string,
  isFavorited: boolean,
) {
  getQueryClient().setQueryData<SidebarConversation[]>(
    queryKeys.conversations(),
    (old) =>
      old?.map((c) =>
        c.id === id
          ? { ...c, is_favorited: isFavorited, updated_at: new Date().toISOString() }
          : c,
      ),
  );
}

/** Optimistically remove a conversation from the cached list. */
export function removeConversationOptimistic(id: string) {
  getQueryClient().setQueryData<SidebarConversation[]>(
    queryKeys.conversations(),
    (old) => old?.filter((c) => c.id !== id),
  );
}

/** Sync a fresh server-side conversation list (replaces the cache). */
export function invalidateConversations() {
  void getQueryClient().invalidateQueries({
    queryKey: queryKeys.conversations(),
  });
}

/** Sync lookup — reads directly from the TQ cache without a network request. */
export function getConversationFromCache(
  id: string,
): SidebarConversation | undefined {
  const conversations = getQueryClient().getQueryData<SidebarConversation[]>(
    queryKeys.conversations(),
  );
  return conversations?.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

function useConversationsQuery() {
  const userId = useAuthStore((state) => state.userId);
  return useQuery({
    queryKey: queryKeys.conversations(),
    queryFn: fetchConversations,
    enabled: typeof userId === "string",
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Drop-in replacement for the old Zustand-based hook. */
export function useSidebarConversations() {
  const { data: conversations = [], isLoading } = useConversationsQuery();
  return { conversations, isLoading };
}

/** Returns the sidebar entry for a single conversation, or undefined. */
export function useConversation(
  conversationId: string,
): SidebarConversation | undefined {
  const { data: conversations } = useConversationsQuery();
  return conversations?.find((c) => c.id === conversationId);
}
