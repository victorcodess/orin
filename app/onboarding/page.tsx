import { Suspense } from "react";

import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

function OnboardingFallback() {
  return (
    <div className="bg-background flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingGate />
    </Suspense>
  );
}
