"use client";

import type { UIMessage } from "ai";
import { useQuery } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import type { AssistantConfig } from "@/lib/orin/defaults";
import type { MessageRow } from "@/lib/ai/message-utils";

export type ConversationCache = {
  assistant: AssistantConfig;
  messages: UIMessage[];
  messageSources: Record<string, MessageRow["source"]>;
};

// ---------------------------------------------------------------------------
// Query function
// ---------------------------------------------------------------------------

export async function fetchConversationData(
  id: string,
): Promise<ConversationCache | null> {
  const response = await fetch(`/api/conversations/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load conversation");
  return (await response.json()) as ConversationCache;
}

// ---------------------------------------------------------------------------
// Cache helpers — backed by the TQ QueryClient so all React subscribers
// re-render automatically when data changes.
// ---------------------------------------------------------------------------

/** Write a full conversation entry into the TQ cache. */
export function setConversationData(id: string, data: ConversationCache) {
  getQueryClient().setQueryData<ConversationCache>(
    queryKeys.conversation(id),
    data,
  );
}

/** Remove a conversation from the TQ cache entirely. */
export function removeConversationData(id: string) {
  getQueryClient().removeQueries({ queryKey: queryKeys.conversation(id) });
}

/**
 * Prefetch a conversation on sidebar hover/focus.
 * No-ops if the data is already fresh in cache.
 */
export function prefetchConversation(id: string) {
  void getQueryClient().prefetchQuery({
    queryKey: queryKeys.conversation(id),
    queryFn: () => fetchConversationData(id),
    // Conversations only go stale when explicitly invalidated — never auto-refetch.
    staleTime: Infinity,
  });
}

/** Remove ALL cached conversation threads (e.g. after deleting all chats). */
export function clearAllConversationData() {
  getQueryClient().removeQueries({ queryKey: ["conversation"] });
}

/**
 * Reactive conversation query for a single thread.
 * staleTime is Infinity — threads only update via explicit cache writes.
 */
export function useConversationQuery(
  conversationId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.conversation(conversationId),
    queryFn: () => fetchConversationData(conversationId),
    enabled: options?.enabled ?? true,
    staleTime: Infinity,
    retry: false,
  });
}
