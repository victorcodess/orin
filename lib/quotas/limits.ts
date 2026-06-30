import "server-only";

import type { QuotaContext, QuotaOperation, QuotaTier } from "@/lib/quotas/types";
import { createAdminClient } from "@/lib/supabase/admin";

export const QUOTA_LIMITS = {
  anon: {
    new_conversation: 1,
    message_turn: 5,
    voice_session: 0,
    read_aloud: 0,
  },
  authed: {
    new_conversation: 3,
    message_turn: 20,
    voice_session: 3,
    read_aloud: 5,
  },
} as const;

export function quotaTier(ctx: QuotaContext): QuotaTier {
  return ctx.userId ? "authed" : "anon";
}

export function quotaLimit(ctx: QuotaContext, operation: QuotaOperation): number {
  return QUOTA_LIMITS[quotaTier(ctx)][operation];
}

export async function countQuotaUsage(
  ctx: QuotaContext,
  operation: QuotaOperation,
): Promise<number> {
  const supabase = createAdminClient();

  if (operation === "new_conversation") {
    let query = supabase
      .from("conversations")
      .select("id", { count: "exact", head: true });

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

  if (operation === "message_turn") {
    let query = supabase
      .from("messages")
      .select("id, conversations!inner(user_id, session_id)", {
        count: "exact",
        head: true,
      })
      .eq("role", "user");

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

  const usageType =
    operation === "voice_session" ? "voice_minutes" : "tts_chars";

  let query = supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("type", usageType);

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
  const used = await countQuotaUsage(ctx, operation);
  return used < quotaLimit(ctx, operation);
}
