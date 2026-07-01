import "server-only";

import type { KeySource, QuotaContext } from "@/lib/quotas/types";
import { createAdminClient } from "@/lib/supabase/admin";

type RecordUsageInput = {
  ctx: QuotaContext;
  type: "voice_minutes" | "tts_chars";
  source: KeySource;
  conversationId?: string | null;
  amount?: number;
};

export async function recordUsageEvent({
  ctx,
  type,
  source,
  conversationId = null,
  amount = 1,
}: RecordUsageInput): Promise<void> {
  if (source !== "platform") {
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("usage_events").insert({
    user_id: ctx.userId,
    session_id: ctx.userId ? null : ctx.sessionId,
    conversation_id: conversationId,
    type,
    amount,
  });

  if (error) {
    throw error;
  }
}

export async function hasRecentVoiceComplete(
  conversationId: string,
  withinMs = 30_000,
): Promise<boolean> {
  const supabase = createAdminClient();
  const since = new Date(Date.now() - withinMs).toISOString();

  const { count, error } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("type", "voice_minutes")
    .gte("created_at", since);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}
