import { getAssistantConfig } from "@/lib/ai/assistant-config";
import { saveMessage } from "@/lib/ai/messages";
import { debugLog } from "@/lib/debug";
import { getOrCreateSessionId, getSessionId } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ConversationRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
};

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function createConversation(): Promise<ConversationRow> {
  const supabase = createAdminClient();
  const userId = await getAuthUserId();
  const sessionId = userId ? null : await getOrCreateSessionId();
  const config = await getAssistantConfig(userId);

  debugLog("conversations", "creating conversation", { userId, sessionId });

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      session_id: sessionId,
      title: `Chat with ${config.name}`,
    })
    .select("id, user_id, session_id, title, created_at, updated_at")
    .single();

  if (error || !data) {
    debugLog("conversations", "create failed", { error });
    throw error ?? new Error("Failed to create conversation");
  }

  debugLog("conversations", "created", { id: data.id });

  await saveMessage({
    conversationId: data.id,
    role: "assistant",
    content: config.firstMessage,
    source: "text",
  });

  return data as ConversationRow;
}

export async function getConversation(
  conversationId: string,
): Promise<ConversationRow | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id, session_id, title, created_at, updated_at")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ConversationRow | null) ?? null;
}

export async function verifyConversationAccess(
  conversationId: string,
): Promise<ConversationRow> {
  const conversation = await getConversation(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const userId = await getAuthUserId();

  if (userId) {
    if (conversation.user_id === userId) {
      return conversation;
    }
    throw new Error("Forbidden");
  }

  const sessionId = await getSessionId();

  debugLog("conversations", "verify access (anon)", {
    conversationId,
    cookieSessionId: sessionId ?? null,
    conversationSessionId: conversation.session_id,
    match: sessionId === conversation.session_id,
  });

  if (sessionId && conversation.session_id === sessionId) {
    return conversation;
  }

  throw new Error("Forbidden");
}
