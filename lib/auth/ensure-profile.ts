import "server-only";

import { googleDisplayName } from "@/lib/auth/google-display-name";
import { createAdminClient } from "@/lib/supabase/admin";

/** Create a profiles row when signup predates the DB trigger or backfill was missed. */
export async function ensureUserProfile(authUser: {
  id: string;
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}): Promise<void> {
  const admin = createAdminClient();

  const { data: existing, error: readError } = await admin
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existing) {
    return;
  }

  const { error: insertError } = await admin.from("profiles").insert({
    id: authUser.id,
    display_name: googleDisplayName(authUser),
  });

  if (insertError && insertError.code !== "23505") {
    throw insertError;
  }
}
