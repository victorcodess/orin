import type { ConversationRow } from "@/lib/ai/conversations";

let cachedConversations: ConversationRow[] | null = null;

export function getCachedConversations() {
  return cachedConversations;
}

export function setCachedConversations(conversations: ConversationRow[]) {
  cachedConversations = conversations;
}

export function clearConversationsCache() {
  cachedConversations = null;
}
