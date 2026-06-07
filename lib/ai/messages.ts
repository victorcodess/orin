import { isTextUIPart, type UIMessage } from "ai";

import { debugLog } from "@/lib/debug";
import { isValidUuid } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export type MessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  source: "text" | "voice";
  created_at: string;
};

export function toUIMessages(rows: MessageRow[]): UIMessage[] {
  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    parts: [{ type: "text" as const, text: row.content }],
  }));
}

export function textFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

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
    debugLog("messages", "loadHistory failed", { conversationId, error });
    throw error;
  }

  debugLog("messages", "loadHistory", {
    conversationId,
    count: data?.length ?? 0,
  });

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

  // AI SDK client IDs are not UUIDs — dedupe by latest matching content instead.
  const { data: latest } = await supabase
    .from("messages")
    .select("content")
    .eq("conversation_id", conversationId)
    .eq("role", role)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.content === content) {
    debugLog("messages", "skipped duplicate message", {
      conversationId,
      clientId: id,
    });
    return;
  }

  await saveMessage({ conversationId, role, content, source });
}
