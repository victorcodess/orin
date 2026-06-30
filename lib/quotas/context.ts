import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSessionId } from "@/lib/session";
import type { QuotaContext } from "@/lib/quotas/types";

export async function getQuotaContext(): Promise<QuotaContext> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;

  return {
    userId,
    sessionId: userId ? null : ((await getSessionId()) ?? null),
  };
}
