import { getAssistantConfig } from "@/lib/ai/assistant-config";
import { verifyConversationAccess } from "@/lib/ai/conversations";
import { loadHistory, toUIMessages } from "@/lib/ai/messages";

export async function loadConversationData(conversationId: string) {
  const conversation = await verifyConversationAccess(conversationId);
  const [assistant, history] = await Promise.all([
    getAssistantConfig(conversation.user_id),
    loadHistory(conversationId),
  ]);

  return { assistant, messages: toUIMessages(history) };
}
