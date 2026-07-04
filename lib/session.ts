import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export const ORIN_SESSION_COOKIE = "orin_session";

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

export async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ORIN_SESSION_COOKIE)?.value;
}

/** Route Handlers and Server Actions only — not Server Components. */
export async function ensureSessionCookie(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ORIN_SESSION_COOKIE)?.value;

  if (existing) {
    return existing;
  }

  const id = uuidv4();
  cookieStore.set(ORIN_SESSION_COOKIE, id, SESSION_COOKIE_OPTIONS);

  return id;
}
