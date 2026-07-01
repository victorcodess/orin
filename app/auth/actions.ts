"use server";

import { redirect } from "next/navigation";

import { getAuthCallbackUrl } from "@/lib/auth/site-url";
import { safeReturnUrl } from "@/lib/auth/return-url";
import { setOnboardingCompleted } from "@/lib/auth/post-auth";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle(returnUrl?: string) {
  const supabase = await createClient();
  const callbackUrl = new URL(await getAuthCallbackUrl());
  const safeNext = safeReturnUrl(returnUrl);

  if (safeNext) {
    callbackUrl.searchParams.set("next", safeNext);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { error: "Could not start Google sign-in" };
}

export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.auth.signOut();
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  await setOnboardingCompleted(user.id);
  redirect("/new");
}
