import type { ConversationRow } from "@/lib/ai/conversations";

let cachedConversations:
  | { userId: string | null; conversations: ConversationRow[] }
  | null = null;

export function getCachedConversations(userId?: string | null) {
  if (!cachedConversations) {
    return null;
  }

  if (userId !== undefined && cachedConversations.userId !== userId) {
    return null;
  }

  return cachedConversations.conversations;
}

export function getCachedConversationsUserId() {
  return cachedConversations?.userId;
}

export function setCachedConversations(
  conversations: ConversationRow[],
  userId: string | null
) {
  cachedConversations = { userId, conversations };
}

export function clearConversationsCache() {
  cachedConversations = null;
}
