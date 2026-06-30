import { NextResponse } from "next/server";

import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { resolvedDisplayName } from "@/lib/auth/google-display-name";
import { getOnboardingCompleted } from "@/lib/auth/post-auth";
import { createClient } from "@/lib/supabase/server";

function toSidebarUser(
  authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  },
  storedDisplayName: string | null | undefined,
) {
  return {
    name: resolvedDisplayName(storedDisplayName, authUser),
    email: authUser.email ?? "",
    avatar: (authUser.user_metadata?.avatar_url as string | undefined) ?? "",
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const authUser = data.user;

  if (!authUser) {
    return NextResponse.json(
      { user: null, userId: null, onboardingCompleted: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  await ensureUserProfile(authUser);

  const [{ data: profile }, onboardingCompleted] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", authUser.id)
      .maybeSingle(),
    getOnboardingCompleted(authUser.id),
  ]);

  return NextResponse.json(
    {
      user: toSidebarUser(authUser, profile?.display_name),
      userId: authUser.id,
      onboardingCompleted,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
