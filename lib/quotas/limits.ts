import "server-only";

import type { QuotaContext, QuotaOperation, QuotaTier } from "@/lib/quotas/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const QUOTA_LIMITS = {
  anon: {
    new_conversation: 1,
    message_turn: 8,
    voice_session: 0,
    read_aloud: 0,
  },
  authed: {
    new_conversation: 10,
    message_turn: 40,
    voice_session: 10,
    read_aloud: 15,
  },
} as const;

/** Per-call ceiling billed to platform voice allowance. */
export const VOICE_MAX_MINUTES_PER_CALL = 5;

export function quotaTier(ctx: QuotaContext): QuotaTier {
  return ctx.userId ? "authed" : "anon";
}

export function quotaLimit(ctx: QuotaContext, operation: QuotaOperation): number {
  return QUOTA_LIMITS[quotaTier(ctx)][operation];
}

export function billVoiceMinutes(durationSeconds: number): number {
  if (durationSeconds < 1) {
    return 0;
  }

  return Math.min(
    VOICE_MAX_MINUTES_PER_CALL,
    Math.ceil(durationSeconds / 60),
  );
}

export async function countVoiceMinutesUsed(ctx: QuotaContext): Promise<number> {
  if (!ctx.userId && !ctx.sessionId) {
    return 0;
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("usage_events")
    .select("amount")
    .eq("type", "voice_minutes");

  if (ctx.userId) {
    query = query.eq("user_id", ctx.userId);
  } else if (ctx.sessionId) {
    query = query.eq("session_id", ctx.sessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data?.reduce((sum, row) => sum + Number(row.amount), 0) ?? 0;
}

export async function countQuotaUsage(
  ctx: QuotaContext,
  operation: QuotaOperation,
): Promise<number> {
  const supabase = createAdminClient();

  if (operation === "new_conversation") {
    let query = supabase
      .from("messages")
      .select("conversation_id, conversations!inner(user_id, session_id)")
      .eq("role", "user")
      .eq("source", "text");

    if (ctx.userId) {
      query = query.eq("conversations.user_id", ctx.userId);
    } else if (ctx.sessionId) {
      query = query.eq("conversations.session_id", ctx.sessionId);
    } else {
      return 0;
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return new Set(data?.map((row) => row.conversation_id) ?? []).size;
  }

  if (operation === "message_turn") {
    let query = supabase
      .from("messages")
      .select("id, conversations!inner(user_id, session_id)", {
        count: "exact",
        head: true,
      })
      .eq("role", "user")
      .eq("source", "text");

    if (ctx.userId) {
      query = query.eq("conversations.user_id", ctx.userId);
    } else if (ctx.sessionId) {
      query = query.eq("conversations.session_id", ctx.sessionId);
    } else {
      return 0;
    }

    const { count, error } = await query;
    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  if (operation === "voice_session") {
    return countVoiceMinutesUsed(ctx);
  }

  let query = supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("type", "tts_chars");

  if (ctx.userId) {
    query = query.eq("user_id", ctx.userId);
  } else if (ctx.sessionId) {
    query = query.eq("session_id", ctx.sessionId);
  } else {
    return 0;
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function isUnderQuota(
  ctx: QuotaContext,
  operation: QuotaOperation,
): Promise<boolean> {
  if (ctx.isAdmin) {
    return true;
  }

  if (operation === "voice_session") {
    const minutesUsed = await countVoiceMinutesUsed(ctx);
    return minutesUsed + 1 <= quotaLimit(ctx, "voice_session");
  }

  const used = await countQuotaUsage(ctx, operation);
  return used < quotaLimit(ctx, operation);
}
