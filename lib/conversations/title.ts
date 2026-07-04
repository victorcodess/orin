import type { ConversationRow } from "@/lib/ai/conversation-types";
import { ORIN_NAME } from "@/lib/orin/defaults";
import {
  renameConversationOptimistic,
  removeConversationOptimistic,
  invalidateConversations,
} from "@/lib/stores/conversations-store";

export const UNTITLED_CHAT_LABEL = "Untitled chat";

export function titleFromUserMessage(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return `Chat with ${ORIN_NAME}`;
  return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

export function conversationDisplayTitle(title: string | null | undefined) {
  return title?.trim() || UNTITLED_CHAT_LABEL;
}

export function normalizeConversationTitleInput(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed || trimmed === UNTITLED_CHAT_LABEL) return null;
  return trimmed;
}

/** Optimistically apply a title change to the TQ cache. */
export function broadcastConversationTitleChange(
  conversationId: string,
  title: string | null,
) {
  renameConversationOptimistic(conversationId, title);
}

export async function patchConversationTitle(
  conversationId: string,
  titleDraft: string,
): Promise<ConversationRow> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: titleDraft }),
  });

  if (!response.ok) throw new Error("Failed to rename chat");
  return (await response.json()) as ConversationRow;
}

/** Optimistically remove a conversation from the TQ cache. */
export function broadcastConversationDelete(conversationId: string) {
  removeConversationOptimistic(conversationId);
}

/** Restore the deleted conversation by re-fetching the list from the server. */
export function undoConversationDelete() {
  invalidateConversations();
}

export async function deleteConversationById(
  conversationId: string,
): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Failed to delete chat");
}
