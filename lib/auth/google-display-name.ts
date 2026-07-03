import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AuthUserLike = {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
};

export function googleDisplayName(user: AuthUserLike) {
  return (
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User"
  );
}

export function resolvedDisplayName(
  stored: string | null | undefined,
  user: AuthUserLike,
) {
  const trimmed = stored?.trim();
  return trimmed || googleDisplayName(user);
}

export async function fetchDisplayNameByUserId(
  userId: string,
): Promise<string | null> {
  const admin = createAdminClient();

  const [{ data: profile }, { data: authData, error }] = await Promise.all([
    admin.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);

  if (error || !authData.user) {
    return null;
  }

  return resolvedDisplayName(profile?.display_name, authData.user);
}
