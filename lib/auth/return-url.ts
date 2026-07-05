import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { AuthIntent } from "@/lib/auth/login-intent";

const DEFAULT_AUTH_RETURN = "/new";

function isChatReturnPath(pathname: string): boolean {
  return (
    pathname === "/new" ||
    pathname === "/c" ||
    pathname.startsWith("/c/")
  );
}

function pathnameFromReturnUrl(url: string): string {
  const hashIndex = url.indexOf("#");
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const queryIndex = withoutHash.indexOf("?");
  return queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
}

/** Keep chat URLs; send everything else to new chat after login. */
export function resolveAuthReturnUrl(
  value: string | null | undefined,
): string {
  const safe = safeReturnUrl(value);
  if (!safe) {
    return DEFAULT_AUTH_RETURN;
  }

  if (isChatReturnPath(pathnameFromReturnUrl(safe))) {
    return safe;
  }

  return DEFAULT_AUTH_RETURN;
}

/** Safe in-app return path (pathname, search, hash). */
export function safeReturnUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.includes("\0")
  ) {
    return value;
  }

  return null;
}

type BuildLoginHrefOptions = {
  returnUrl?: string | null;
  intent?: AuthIntent;
};

export function buildLoginHref(options: BuildLoginHrefOptions = {}): string {
  const params = new URLSearchParams();
  const resolved = resolveAuthReturnUrl(options.returnUrl);

  if (resolved !== DEFAULT_AUTH_RETURN) {
    params.set("next", resolved);
  }

  if (options.intent) {
    params.set("intent", options.intent);
  }

  const query = params.toString();
  return query ? `/auth/login?${query}` : "/auth/login";
}

export function getCurrentReturnUrl(): string {
  if (typeof window === "undefined") {
    return DEFAULT_AUTH_RETURN;
  }

  const { pathname, search, hash } = window.location;
  return resolveAuthReturnUrl(`${pathname}${search}${hash}`);
}

export function buildLoginHrefFromHere(intent: AuthIntent = "signup"): string {
  return buildLoginHref({ returnUrl: getCurrentReturnUrl(), intent });
}

export function navigateAfterLogout(router: AppRouterInstance) {
  const { pathname, search, hash } =
    typeof window === "undefined"
      ? { pathname: "/", search: "", hash: "" }
      : window.location;

  const target =
    pathname === "/" ? "/" : `${pathname}${search}${hash}`;
  const hashIndex = target.indexOf("#");

  if (hashIndex === -1) {
    router.push(target);
  } else {
    router.push(target.slice(0, hashIndex));
    window.location.hash = target.slice(hashIndex + 1);
  }

  router.refresh();
}
