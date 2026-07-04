import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ORIN_AUTH_HEADER } from "@/lib/auth/request-session";
import { MARKETING_PUBLIC_PATHS } from "@/components/marketing/marketing-links";

import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const pathname = request.nextUrl.pathname;

  // Supabase falls back to Site URL (/) when redirectTo doesn't match the allow list.
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  const isPublicPath =
    MARKETING_PUBLIC_PATHS.has(pathname) ||
    pathname === "/opengraph-image" ||
    pathname === "/twitter-image" ||
    pathname === "/new" ||
    pathname === "/c" ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/conversations") ||
    pathname.startsWith("/api/voice") ||
    pathname.startsWith("/api/elevenlabs") ||
    pathname.startsWith("/api/assistant-config") ||
    pathname.startsWith("/api/profile") ||
    pathname.startsWith("/api/usage") ||
    pathname.startsWith("/api/keys") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth");

  if (!user && !isPublicPath) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(ORIN_AUTH_HEADER, user ? "1" : "0");

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Preserve refreshed Supabase session cookies on the forwarded response.
  for (const cookie of supabaseResponse.cookies.getAll()) {
    response.cookies.set(cookie);
  }

  return response;
}
