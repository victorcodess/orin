import type { ConversationRow } from "@/lib/ai/conversations";
import { toast } from "@/components/nexus-ui/toaster";
import {
  CONVERSATIONS_CHANGED_EVENT,
  type ConversationsChangedDetail,
  getCachedConversations,
  updateCachedConversationFavorite,
} from "@/lib/conversations-cache";

type FavoriteSyncState = {
  version: number;
  lastConfirmed: boolean;
};

const favoriteSyncState = new Map<string, FavoriteSyncState>();

export function broadcastConversationFavoriteChange(
  conversationId: string,
  isFavorited: boolean,
) {
  updateCachedConversationFavorite(conversationId, isFavorited);
  window.dispatchEvent(
    new CustomEvent<ConversationsChangedDetail>(CONVERSATIONS_CHANGED_EVENT, {
      detail: { type: "favorite", conversationId, isFavorited },
    }),
  );
}

export async function patchConversationFavorite(
  conversationId: string,
  isFavorited: boolean,
): Promise<ConversationRow> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_favorited: isFavorited }),
  });

  if (!response.ok) {
    throw new Error("Failed to update favorite");
  }

  return (await response.json()) as ConversationRow;
}

export function toggleConversationFavorite(conversationId: string): void {
  const cached = getCachedConversations()?.find(
    (conversation) => conversation.id === conversationId,
  );
  const currentIsFavorited = cached?.is_favorited ?? false;

  void syncConversationFavorite(conversationId, !currentIsFavorited);
}

async function syncConversationFavorite(
  conversationId: string,
  isFavorited: boolean,
): Promise<void> {
  const existing = favoriteSyncState.get(conversationId);
  const version = (existing?.version ?? 0) + 1;
  const lastConfirmed = existing?.lastConfirmed ?? !isFavorited;

  favoriteSyncState.set(conversationId, { version, lastConfirmed });
  broadcastConversationFavoriteChange(conversationId, isFavorited);

  try {
    const updated = await patchConversationFavorite(
      conversationId,
      isFavorited,
    );
    const latest = favoriteSyncState.get(conversationId);

    if (!latest || latest.version !== version) {
      return;
    }

    favoriteSyncState.set(conversationId, {
      version,
      lastConfirmed: updated.is_favorited,
    });
    broadcastConversationFavoriteChange(
      conversationId,
      updated.is_favorited,
    );
  } catch {
    const latest = favoriteSyncState.get(conversationId);

    if (!latest || latest.version !== version) {
      return;
    }

    broadcastConversationFavoriteChange(conversationId, latest.lastConfirmed);
    toast.error("Couldn't update favorite");
  }
}
