import "server-only";

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
