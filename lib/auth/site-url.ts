import "server-only";

import { headers } from "next/headers";

/** Origin used for OAuth redirectTo — must match Supabase redirect URL allow list exactly. */
export async function getAuthSiteOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host");
  if (forwardedHost) {
    return `https://${forwardedHost.split(",")[0]?.trim()}`;
  }

  const host = headerList.get("host");
  if (host) {
    const protocol = headerList.get("x-forwarded-proto") ?? "http";
    return `${protocol}://${host}`;
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function getAuthCallbackUrl(): Promise<string> {
  return `${await getAuthSiteOrigin()}/auth/callback`;
}

export function getOriginFromRequest(request: Request): string {
  const { origin, hostname } = new URL(request.url);
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost.split(",")[0]?.trim()}`;
  }

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return origin;
  }

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  return origin;
}
