import {
  completePostAuth,
  postAuthRedirectPath,
} from "@/lib/auth/post-auth";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectUrl } from "@/lib/safe-redirect";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectUrl(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { onboardingCompleted } = await completePostAuth(user.id);
        const isSignup = type === "signup";
        redirect(
          postAuthRedirectPath({
            onboardingCompleted,
            isSignup,
            next,
          }),
        );
      }

      redirect(next);
    }

    redirect(`/auth/error?error=${error?.message}`);
  }

  redirect(`/auth/error?error=No token hash or type`);
}
