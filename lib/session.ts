import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

import { debugLog } from "@/lib/debug";

export const ORIN_SESSION_COOKIE = "orin_session";

export async function getSessionId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ORIN_SESSION_COOKIE)?.value;
}

export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(ORIN_SESSION_COOKIE)?.value;

  if (existing) {
    debugLog("session", "reusing existing session", { sessionId: existing });
    return existing;
  }

  const id = uuidv4();
  debugLog("session", "created new session", { sessionId: id });
  cookieStore.set(ORIN_SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return id;
}
