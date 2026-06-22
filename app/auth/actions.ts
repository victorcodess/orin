"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectUrl } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = { error?: string };
export type PasswordResetResult = AuthActionResult | { success: true };

async function siteOrigin() {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  return `${protocol}://${host}`;
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

  const origin = await siteOrigin();
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

  const origin = await siteOrigin();
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
