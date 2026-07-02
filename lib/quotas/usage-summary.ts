import "server-only";

import type { QuotaContext, QuotaOperation, QuotaUsageSummary } from "@/lib/quotas/types";
import { countQuotaUsage, QUOTA_LIMITS, quotaLimit, quotaTier } from "@/lib/quotas/limits";
import { getMaskedUserKeys } from "@/lib/quotas/keys";

const OPERATIONS: QuotaOperation[] = [
  "new_conversation",
  "message_turn",
  "voice_session",
  "read_aloud",
];

export async function buildQuotaUsageSummary(
  ctx: QuotaContext,
): Promise<QuotaUsageSummary> {
  const tier = quotaTier(ctx);
  const limits = QUOTA_LIMITS[tier];
  const used = {} as QuotaUsageSummary["used"];
  const remaining = {} as QuotaUsageSummary["remaining"];

  const isAdmin = ctx.isAdmin ?? false;

  for (const operation of OPERATIONS) {
    const count = await countQuotaUsage(ctx, operation);
    const limit = quotaLimit(ctx, operation);
    used[operation] = count;
    remaining[operation] = isAdmin ? limit : Math.max(0, limit - count);
  }

  const masked =
    ctx.userId != null
      ? await getMaskedUserKeys(ctx.userId)
      : {
          openaiMasked: null,
          elevenlabsMasked: null,
          hasOpenaiKey: false,
          hasElevenlabsKey: false,
        };

  return {
    tier,
    isAdmin,
    limits: { ...limits },
    used,
    remaining,
    keys: masked,
  };
}
