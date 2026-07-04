const DEFAULT_REDIRECT = "/new";

export function safeRedirectUrl(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  if (!value) {
    return fallback;
  }

  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("\0")
  ) {
    return value;
  }

  return fallback;
}
