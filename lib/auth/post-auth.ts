import "server-only";

import {
  clearAssistantConfigCookie,
  getAssistantConfigFromCookie,
} from "@/lib/ai/assistant-config";
import { buildPersonalityPrompt } from "@/lib/orin/personality/prompts";
import { getSessionId } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function mergeAnonSessionToUser(
  userId: string,
  sessionId: string,
): Promise<number> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("merge_anon_session_to_user", {
    target_user_id: userId,
    anon_session_id: sessionId,
  });

  if (error) {
    throw error;
  }

  return typeof data === "number" ? data : 0;
}

export async function mergeAssistantConfigCookie(userId: string): Promise<void> {
  const cookieConfig = await getAssistantConfigFromCookie();
  if (!cookieConfig) {
    return;
  }

  const supabase = createAdminClient();
  const personalitySettings = cookieConfig.personalitySettings;

  const { error } = await supabase.from("assistant_configs").upsert(
    {
      user_id: userId,
      personality: buildPersonalityPrompt(personalitySettings),
      personality_settings: personalitySettings,
      voice_id: cookieConfig.voiceId,
      voice_speed: cookieConfig.voiceSpeed,
      is_default: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }

  await clearAssistantConfigCookie();
}

export async function getOnboardingCompleted(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.onboarding_completed ?? false;
}

/** True when the auth account was just created (OAuth / immediate signup). */
export function isNewAuthAccount(user: { created_at: string }): boolean {
  const ageMs = Date.now() - new Date(user.created_at).getTime();
  return ageMs >= 0 && ageMs < 120_000;
}

export async function completePostAuth(userId: string): Promise<{
  onboardingCompleted: boolean;
  mergedConversations: number;
}> {
  const sessionId = await getSessionId();
  let mergedConversations = 0;

  if (sessionId) {
    mergedConversations = await mergeAnonSessionToUser(userId, sessionId);
    await mergeAssistantConfigCookie(userId);
  }

  const onboardingCompleted = await getOnboardingCompleted(userId);

  return { onboardingCompleted, mergedConversations };
}

export async function setOnboardingCompleted(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export function postAuthRedirectPath({
  onboardingCompleted,
  isSignup,
  next,
}: {
  onboardingCompleted: boolean;
  isSignup: boolean;
  next?: string | null;
}): string {
  if (isSignup && !onboardingCompleted) {
    return "/onboarding";
  }

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return "/new";
}
