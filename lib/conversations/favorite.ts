import type { ConversationRow } from "@/lib/ai/conversation-types";
import { toast } from "@/components/nexus-ui/toaster";
import {
  getConversationFromCache,
  setConversationFavoriteOptimistic,
} from "@/lib/stores/conversations-store";

type FavoriteSyncState = {
  version: number;
  lastConfirmed: boolean;
};

const favoriteSyncState = new Map<string, FavoriteSyncState>();

export function broadcastConversationFavoriteChange(
  conversationId: string,
  isFavorited: boolean,
) {
  setConversationFavoriteOptimistic(conversationId, isFavorited);
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

  if (!response.ok) throw new Error("Failed to update favorite");
  return (await response.json()) as ConversationRow;
}

export function toggleConversationFavorite(conversationId: string): void {
  const cached = getConversationFromCache(conversationId);
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
    const updated = await patchConversationFavorite(conversationId, isFavorited);
    const latest = favoriteSyncState.get(conversationId);
    if (!latest || latest.version !== version) return;

    favoriteSyncState.set(conversationId, {
      version,
      lastConfirmed: updated.is_favorited,
    });
    broadcastConversationFavoriteChange(conversationId, updated.is_favorited);
  } catch {
    const latest = favoriteSyncState.get(conversationId);
    if (!latest || latest.version !== version) return;

    broadcastConversationFavoriteChange(conversationId, latest.lastConfirmed);
    toast.error("Couldn't update favorite");
  }
}
