import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getSessionId } from "@/lib/auth/session";
import type { QuotaContext } from "@/lib/quotas/types";

export async function getQuotaContext(): Promise<QuotaContext> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id ?? null;

  let isAdmin = false;

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();

    isAdmin = profile?.is_admin ?? false;
  }

  return {
    userId,
    sessionId: userId ? null : ((await getSessionId()) ?? null),
    isAdmin,
  };
}
