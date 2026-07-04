import { NextResponse } from "next/server";

import {
  completePostAuth,
  isNewAuthAccount,
  postAuthRedirectPath,
} from "@/lib/auth/post-auth";
import { getOriginFromRequest } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectUrl } from "@/lib/auth/safe-redirect";

export async function GET(request: Request) {
  const origin = getOriginFromRequest(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectUrl(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(error.message)}`,
      );
    }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (user) {
      const { onboardingCompleted } = await completePostAuth(user.id);
      const redirectPath = postAuthRedirectPath({
        onboardingCompleted,
        isSignup: isNewAuthAccount(user),
        next,
      });
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error?error=Auth+callback+failed`);
}
