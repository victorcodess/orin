import "server-only";

import { resolvedDisplayName } from "@/lib/auth/google-display-name";
import { requireAuthedUser } from "@/lib/auth/require-authed-user";
import type { SidebarUser } from "@/lib/stores/auth-store";

export type OnboardingSession = {
  user: SidebarUser;
  userId: string;
  onboardingCompleted: boolean;
};

export async function loadOnboardingSession(): Promise<OnboardingSession | null> {
  const authed = await requireAuthedUser();
  if (!authed) {
    return null;
  }

  const { supabase, user } = authed;
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    onboardingCompleted: profile?.onboarding_completed ?? false,
    user: {
      name: resolvedDisplayName(profile?.display_name, user),
      email: user.email ?? "",
      avatar: (user.user_metadata?.avatar_url as string | undefined) ?? "",
    },
  };
}
