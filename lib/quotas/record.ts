import "server-only";

import type { QuotaContext } from "@/lib/quotas/types";
import { createAdminClient } from "@/lib/supabase/admin";

type RecordUsageInput = {
  ctx: QuotaContext;
  type: "voice_minutes" | "tts_chars";
  conversationId?: string | null;
};

export async function recordUsageEvent({
  ctx,
  type,
  conversationId = null,
}: RecordUsageInput): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("usage_events").insert({
    user_id: ctx.userId,
    session_id: ctx.userId ? null : ctx.sessionId,
    conversation_id: conversationId,
    type,
    amount: 1,
  });

  if (error) {
    throw error;
  }
}
