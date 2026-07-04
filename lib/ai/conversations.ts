import "server-only";

import type { ConversationRow } from "@/lib/ai/conversation-types";
import { titleFromUserMessage } from "@/lib/conversations/title";
import { ORIN_NAME } from "@/lib/orin/defaults";
import { getSessionId } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type { ConversationRow } from "@/lib/ai/conversation-types";

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function createConversation(options?: {
  id?: string;
  initialMessage?: string;
}): Promise<ConversationRow> {
  const supabase = createAdminClient();
  const userId = await getAuthUserId();
  const sessionId = userId ? null : await getSessionId();

  if (!userId && !sessionId) {
    throw new Error("Missing anon session cookie");
  }

  const title = options?.initialMessage
    ? titleFromUserMessage(options.initialMessage)
    : `Chat with ${ORIN_NAME}`;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      ...(options?.id ? { id: options.id } : {}),
      user_id: userId,
      session_id: sessionId,
      title,
    })
    .select("id, user_id, session_id, title, is_favorited, created_at, updated_at")
    .single();

  if (error || !data) {
    if (options?.id && error?.code === "23505") {
      const existing = await getConversation(options.id);
      if (existing) {
        return existing;
      }
    }
    throw error ?? new Error("Failed to create conversation");
  }

  return data as ConversationRow;
}

export async function getConversation(
  conversationId: string,
): Promise<ConversationRow | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id, session_id, title, is_favorited, created_at, updated_at")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ConversationRow | null) ?? null;
}

const MAX_CONVERSATION_TITLE_LENGTH = 200;

function normalizeConversationTitle(title: string): string | null {
  const trimmed = title.trim();

  if (!trimmed || trimmed.toLowerCase() === "untitled chat") {
    return null;
  }

  if (trimmed.length <= MAX_CONVERSATION_TITLE_LENGTH) {
    return trimmed;
  }

  return trimmed.slice(0, MAX_CONVERSATION_TITLE_LENGTH);
}

export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<ConversationRow> {
  await verifyConversationAccess(conversationId);

  const normalizedTitle = normalizeConversationTitle(title);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("conversations")
    .update({
      title: normalizedTitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .select("id, user_id, session_id, title, is_favorited, created_at, updated_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update conversation title");
  }

  return data as ConversationRow;
}

export async function updateConversationFavorite(
  conversationId: string,
  isFavorited: boolean,
): Promise<ConversationRow> {
  await verifyConversationAccess(conversationId);

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("conversations")
    .update({
      is_favorited: isFavorited,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .select("id, user_id, session_id, title, is_favorited, created_at, updated_at")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update conversation favorite");
  }

  return data as ConversationRow;
}

export async function maybeUpdateConversationTitle(
  conversationId: string,
  userText: string,
): Promise<void> {
  const trimmed = userText.trim();
  if (!trimmed) {
    return;
  }

  const conversation = await getConversation(conversationId);
  if (!conversation?.title) {
    return;
  }

  const defaultTitle = `Chat with ${ORIN_NAME}`;

  if (conversation.title !== defaultTitle) {
    return;
  }

  const title = titleFromUserMessage(trimmed);
  const supabase = createAdminClient();

  await supabase
    .from("conversations")
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}

export async function listConversations(limit = 30): Promise<ConversationRow[]> {
  const supabase = createAdminClient();
  const userId = await getAuthUserId();
  const sessionId = userId ? null : await getSessionId();

  let query = supabase
    .from("conversations")
    .select(
      "id, user_id, session_id, title, is_favorited, created_at, updated_at, messages!inner(id)",
    )
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    if (!sessionId) {
      return [];
    }
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(({ messages: _messages, ...conversation }) => conversation) as ConversationRow[];
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  await verifyConversationAccess(conversationId);

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
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

  if (sessionId && conversation.session_id === sessionId) {
    return conversation;
  }

  throw new Error("Forbidden");
}
