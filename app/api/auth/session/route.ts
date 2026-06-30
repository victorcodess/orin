import { NextResponse } from "next/server";

import { getOnboardingCompleted } from "@/lib/auth/post-auth";
import { createClient } from "@/lib/supabase/server";

function toSidebarUser(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  return {
    name:
      (authUser.user_metadata?.full_name as string | undefined) ??
      authUser.email?.split("@")[0] ??
      "User",
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

  const onboardingCompleted = await getOnboardingCompleted(authUser.id);

  return NextResponse.json(
    {
      user: toSidebarUser(authUser),
      userId: authUser.id,
      onboardingCompleted,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
