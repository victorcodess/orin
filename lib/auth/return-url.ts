import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { AuthIntent } from "@/lib/auth/login-intent";

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
  const safe = safeReturnUrl(options.returnUrl);

  if (safe) {
    params.set("next", safe);
  }

  if (options.intent) {
    params.set("intent", options.intent);
  }

  const query = params.toString();
  return query ? `/auth/login?${query}` : "/auth/login";
}

export function getCurrentReturnUrl(): string {
  if (typeof window === "undefined") {
    return "/new";
  }

  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
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
