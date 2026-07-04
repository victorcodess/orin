import "server-only";

import { isValidUuid } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import type { MessageRow } from "@/lib/ai/message-utils";

export type { MessageRow } from "@/lib/ai/message-utils";
export {
  isAssistantReplyComplete,
  textFromUIMessage,
  toUIMessages,
} from "@/lib/ai/message-utils";

export async function loadHistory(
  conversationId: string,
): Promise<MessageRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, role, content, source, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as MessageRow[];
}

export async function saveMessage({
  id,
  conversationId,
  role,
  content,
  source = "text",
}: {
  id?: string;
  conversationId: string;
  role: MessageRow["role"];
  content: string;
  source?: MessageRow["source"];
}): Promise<MessageRow> {
  const supabase = createAdminClient();
  const dbId = id && isValidUuid(id) ? id : undefined;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      ...(dbId ? { id: dbId } : {}),
      conversation_id: conversationId,
      role,
      content,
      source,
    })
    .select("id, conversation_id, role, content, source, created_at")
    .single();

  if (error) {
    throw error;
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data as MessageRow;
}

export async function saveMessageIfNew({
  id,
  conversationId,
  role,
  content,
  source = "text",
}: {
  id: string;
  conversationId: string;
  role: MessageRow["role"];
  content: string;
  source?: MessageRow["source"];
}): Promise<void> {
  const supabase = createAdminClient();

  if (isValidUuid(id)) {
    const { data: existing } = await supabase
      .from("messages")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existing) {
      return;
    }

    await saveMessage({ id, conversationId, role, content, source });
    return;
  }

  const { data: latest } = await supabase
    .from("messages")
    .select("content")
    .eq("conversation_id", conversationId)
    .eq("role", role)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.content === content) {
    return;
  }

  await saveMessage({ conversationId, role, content, source });
}

export async function deleteMessagesAfterUserMessage(
  conversationId: string,
  userMessageId: string,
): Promise<boolean> {
  if (!isValidUuid(userMessageId)) {
    return false;
  }

  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("messages")
    .select("created_at")
    .eq("id", userMessageId)
    .eq("conversation_id", conversationId)
    .eq("role", "user")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    return false;
  }

  const { error: deleteError } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId)
    .gt("created_at", existing.created_at);

  if (deleteError) {
    throw deleteError;
  }

  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return true;
}

export async function updateUserMessageAndDeleteAfter({
  id,
  conversationId,
  content,
  source = "text",
}: {
  id: string;
  conversationId: string;
  content: string;
  source?: MessageRow["source"];
}): Promise<boolean> {
  if (!isValidUuid(id)) {
    return false;
  }

  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("messages")
    .select("id")
    .eq("id", id)
    .eq("conversation_id", conversationId)
    .eq("role", "user")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    return false;
  }

  const { error: updateError } = await supabase
    .from("messages")
    .update({ content, source })
    .eq("id", id)
    .eq("conversation_id", conversationId);

  if (updateError) {
    throw updateError;
  }

  await deleteMessagesAfterUserMessage(conversationId, id);

  return true;
}
