import { Suspense } from "react";

import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

function OnboardingFallback() {
  return (
    <p className="text-muted-foreground text-sm">Loading...</p>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingGate />
    </Suspense>
  );
}
