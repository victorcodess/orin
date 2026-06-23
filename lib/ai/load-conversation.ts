import { getAssistantConfig } from "@/lib/ai/assistant-config";
import { verifyConversationAccess } from "@/lib/ai/conversations";
import { loadHistory, toUIMessages } from "@/lib/ai/messages";
import type { MessageRow } from "@/lib/ai/message-utils";

export async function loadConversationData(conversationId: string) {
  const conversation = await verifyConversationAccess(conversationId);
  const [assistant, history] = await Promise.all([
    getAssistantConfig(conversation.user_id),
    loadHistory(conversationId),
  ]);

  const messageSources = Object.fromEntries(
    history.map((row) => [row.id, row.source]),
  ) satisfies Record<string, MessageRow["source"]>;

  return { assistant, messages: toUIMessages(history), messageSources };
}
