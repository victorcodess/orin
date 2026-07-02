import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  OnboardingScreen,
  OnboardingSessionHydrator,
} from "@/components/onboarding/onboarding-screen";
import { loadOnboardingSession } from "@/lib/auth/onboarding-session";

async function OnboardingSessionBridge() {
  const session = await loadOnboardingSession();

  if (!session) {
    redirect("/auth/login?next=/onboarding");
  }

  if (session.onboardingCompleted) {
    redirect("/new");
  }

  return <OnboardingSessionHydrator session={session} />;
}

export default function OnboardingPage() {
  return (
    <>
      <OnboardingScreen />
      <Suspense fallback={null}>
        <OnboardingSessionBridge />
      </Suspense>
    </>
  );
}
