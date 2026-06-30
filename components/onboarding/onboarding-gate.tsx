import { redirect } from "next/navigation";

import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { getOnboardingCompleted } from "@/lib/auth/post-auth";
import { createClient } from "@/lib/supabase/server";

export async function OnboardingGate() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth/login?next=/onboarding");
  }

  const completed = await getOnboardingCompleted(data.user.id);

  if (completed) {
    redirect("/new");
  }

  return <OnboardingScreen />;
}
