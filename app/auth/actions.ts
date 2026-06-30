"use server";

import { redirect } from "next/navigation";

import { getAuthCallbackUrl, getAuthSiteOrigin } from "@/lib/auth/site-url";
import {
  completePostAuth,
  postAuthRedirectPath,
  setOnboardingCompleted,
} from "@/lib/auth/post-auth";
import { safeRedirectUrl } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = { error?: string };
export type PasswordResetResult = AuthActionResult | { success: true };

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: await getAuthCallbackUrl(),
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

export async function signInWithPassword(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { onboardingCompleted } = await completePostAuth(user.id);
    redirect(
      postAuthRedirectPath({
        onboardingCompleted,
        isSignup: false,
        next: formData.get("next") as string | null,
      }),
    );
  }

  redirect(safeRedirectUrl(formData.get("next") as string | null));
}

export async function signUpWithPassword(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const repeatPassword = String(formData.get("repeatPassword") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (password !== repeatPassword) {
    return { error: "Passwords do not match" };
  }

  const origin = await getAuthSiteOrigin();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/new`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/sign-up-success");
}

export async function requestPasswordReset(
  _prev: PasswordResetResult,
  formData: FormData,
): Promise<PasswordResetResult> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required" };
  }

  const origin = await getAuthSiteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your reset link expired. Request a new password reset." };
  }

  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Password is required" };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/new");
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
