import type { ConversationRow } from "@/lib/ai/conversations";
import {
  CONVERSATIONS_CHANGED_EVENT,
  type ConversationsChangedDetail,
  removeCachedConversation,
  updateCachedConversationTitle,
} from "@/lib/conversations-cache";

export const UNTITLED_CHAT_LABEL = "Untitled chat";

export function conversationDisplayTitle(title: string | null | undefined) {
  return title?.trim() || UNTITLED_CHAT_LABEL;
}

export function normalizeConversationTitleInput(title: string): string | null {
  const trimmed = title.trim();

  if (!trimmed || trimmed === UNTITLED_CHAT_LABEL) {
    return null;
  }

  return trimmed;
}

export function broadcastConversationTitleChange(
  conversationId: string,
  title: string | null
) {
  updateCachedConversationTitle(conversationId, title);
  window.dispatchEvent(
    new CustomEvent<ConversationsChangedDetail>(CONVERSATIONS_CHANGED_EVENT, {
      detail: { type: "rename", conversationId, title },
    })
  );
}

export async function patchConversationTitle(
  conversationId: string,
  titleDraft: string
): Promise<ConversationRow> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: titleDraft }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename chat");
  }

  return (await response.json()) as ConversationRow;
}

export function broadcastConversationDelete(conversationId: string) {
  removeCachedConversation(conversationId);
  window.dispatchEvent(
    new CustomEvent<ConversationsChangedDetail>(CONVERSATIONS_CHANGED_EVENT, {
      detail: { type: "delete", conversationId },
    })
  );
}

export async function deleteConversationById(
  conversationId: string
): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete chat");
  }
}
