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
    .select("id, user_id, session_id")
    .eq("active_voice_session_id", voiceSessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function clearVoiceSession(
  conversationId: string,
  pendingToken?: string,
) {
  if (pendingToken) {
    await verifyConversationAccess(conversationId);
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("conversations")
    .update({ active_voice_session_id: null })
    .eq("id", conversationId);

  if (pendingToken) {
    query = query.eq(
      "active_voice_session_id",
      pendingVoiceSessionId(pendingToken),
    );
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}
