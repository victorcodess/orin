import "server-only";

import { verifyConversationAccess } from "@/lib/ai/conversations";
import { createAdminClient } from "@/lib/supabase/admin";

const PENDING_PREFIX = "pending:";

export function pendingVoiceSessionId(pendingToken: string) {
  return `${PENDING_PREFIX}${pendingToken}`;
}

export async function markVoiceCallPending(conversationId: string) {
  await verifyConversationAccess(conversationId);

  const pendingToken = crypto.randomUUID();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("conversations")
    .update({ active_voice_session_id: pendingVoiceSessionId(pendingToken) })
    .eq("id", conversationId);

  if (error) {
    throw error;
  }

  return pendingToken;
}

export async function bindLatestPendingVoiceSession(voiceSessionId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, active_voice_session_id")
    .like("active_voice_session_id", "pending:%")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.active_voice_session_id?.startsWith(PENDING_PREFIX)) {
    return null;
  }

  const pendingToken = data.active_voice_session_id.slice(PENDING_PREFIX.length);

  const { data: updated, error: updateError } = await supabase
    .from("conversations")
    .update({ active_voice_session_id: voiceSessionId })
    .eq("id", data.id)
    .eq("active_voice_session_id", data.active_voice_session_id)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw updateError;
  }

  if (!updated) {
    return null;
  }

  return { conversationId: updated.id, pendingToken };
}

export async function bindVoiceSession({
  conversationId,
  pendingToken,
  voiceSessionId,
}: {
  conversationId: string;
  pendingToken: string;
  voiceSessionId: string;
}) {
  await verifyConversationAccess(conversationId);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("conversations")
    .update({ active_voice_session_id: voiceSessionId })
    .eq("id", conversationId)
    .eq("active_voice_session_id", pendingVoiceSessionId(pendingToken))
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const { data: fallback, error: fallbackError } = await supabase
      .from("conversations")
      .update({ active_voice_session_id: voiceSessionId })
      .eq("id", conversationId)
      .like("active_voice_session_id", `${PENDING_PREFIX}%`)
      .select("id")
      .maybeSingle();

    if (fallbackError) {
      throw fallbackError;
    }

    if (!fallback) {
      throw new Error("Voice session binding expired or invalid");
    }
  }
}

export async function resolveConversationByVoiceSession(voiceSessionId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id")
    .eq("active_voice_session_id", voiceSessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function clearVoiceSession(conversationId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("conversations")
    .update({ active_voice_session_id: null })
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
}
