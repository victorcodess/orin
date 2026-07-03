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
  timeZone,
}: {
  conversationId: string;
  pendingToken: string;
  voiceSessionId: string;
  timeZone?: string | null;
}) {
  await verifyConversationAccess(conversationId);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("conversations")
    .update({
      active_voice_session_id: voiceSessionId,
      ...(timeZone ? { time_zone: timeZone } : {}),
    })
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
      .update({
        active_voice_session_id: voiceSessionId,
        ...(timeZone ? { time_zone: timeZone } : {}),
      })
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
    .select("id, user_id, session_id, time_zone")
    .eq("active_voice_session_id", voiceSessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

type ClearVoiceSessionOptions = {
  pendingToken?: string;
  voiceSessionId?: string;
};

export async function clearVoiceSession(
  conversationId: string,
  options?: ClearVoiceSessionOptions,
) {
  if (options?.pendingToken || options?.voiceSessionId) {
    await verifyConversationAccess(conversationId);
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("conversations")
    .update({ active_voice_session_id: null })
    .eq("id", conversationId);

  if (options?.voiceSessionId) {
    query = query.eq("active_voice_session_id", options.voiceSessionId);
  } else if (options?.pendingToken) {
    query = query.eq(
      "active_voice_session_id",
      pendingVoiceSessionId(options.pendingToken),
    );
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}
