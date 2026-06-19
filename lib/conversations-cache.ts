import type { ConversationRow } from "@/lib/ai/conversations";

export type ConversationsChangedDetail = {
  type?: "rename" | "delete" | "favorite";
  conversationId?: string;
  title?: string | null;
  isFavorited?: boolean;
};

export const CONVERSATIONS_CHANGED_EVENT = "orin:conversations-changed";

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

export function updateCachedConversationTitle(
  conversationId: string,
  title: string | null,
  userId?: string | null
) {
  if (!cachedConversations) {
    return false;
  }

  if (userId !== undefined && cachedConversations.userId !== userId) {
    return false;
  }

  const hasConversation = cachedConversations.conversations.some(
    (conversation) => conversation.id === conversationId
  );

  if (!hasConversation) {
    return false;
  }

  cachedConversations = {
    ...cachedConversations,
    conversations: cachedConversations.conversations.map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            title,
            updated_at: new Date().toISOString(),
          }
        : conversation
    ),
  };

  return true;
}

export function updateCachedConversationFavorite(
  conversationId: string,
  isFavorited: boolean,
  userId?: string | null
) {
  if (!cachedConversations) {
    return false;
  }

  if (userId !== undefined && cachedConversations.userId !== userId) {
    return false;
  }

  const hasConversation = cachedConversations.conversations.some(
    (conversation) => conversation.id === conversationId
  );

  if (!hasConversation) {
    return false;
  }

  cachedConversations = {
    ...cachedConversations,
    conversations: cachedConversations.conversations.map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            is_favorited: isFavorited,
            updated_at: new Date().toISOString(),
          }
        : conversation
    ),
  };

  return true;
}

export function removeCachedConversation(
  conversationId: string,
  userId?: string | null
) {
  if (!cachedConversations) {
    return false;
  }

  if (userId !== undefined && cachedConversations.userId !== userId) {
    return false;
  }

  const nextConversations = cachedConversations.conversations.filter(
    (conversation) => conversation.id !== conversationId
  );

  if (nextConversations.length === cachedConversations.conversations.length) {
    return false;
  }

  cachedConversations = {
    ...cachedConversations,
    conversations: nextConversations,
  };

  return true;
}

export function clearConversationsCache() {
  cachedConversations = null;
}
