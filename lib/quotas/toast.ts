"use client";

import { buildLoginHrefFromHere } from "@/lib/auth/return-url";
import { toast } from "@/components/nexus-ui/toaster";
import { openSettings } from "@/lib/settings/routes";
import type { FetchError } from "@/lib/quotas/client-errors";

const SIGNUP_TOAST_DURATION = 10000;

function signupToastAction() {
  return {
    label: "Sign up",
    onClick: () => {
      window.location.href = buildLoginHrefFromHere("signup");
    },
  };
}

export function toastSignupForFeature(feature: "voice calls" | "read aloud") {
  const title =
    feature === "voice calls"
      ? "Sign up for voice calls"
      : "Sign up for read aloud";
  const description =
    feature === "voice calls"
      ? "Voice calls are available after you create an account."
      : "Read aloud is available after you create an account.";

  toast.error(title, {
    description,
    action: signupToastAction(),
    duration: SIGNUP_TOAST_DURATION,
  });
}

export function toastQuotaError(error: FetchError | Error) {
  const fetchError = error as FetchError;
  const code = fetchError.code;
  const action = fetchError.action;
  const message = error.message;

  if (code === "feature_requires_auth") {
    toast.error("Sign up required", {
      description: message,
      action: signupToastAction(),
      duration: SIGNUP_TOAST_DURATION,
    });
    return;
  }

  if (code === "signup_required" || action === "signup") {
    toast.error("Free allowance used", {
      description: message,
      action: signupToastAction(),
      duration: SIGNUP_TOAST_DURATION,
    });
    return;
  }

  if (code === "keys_required" || action === "add_keys") {
    toast.error("Add your API keys", {
      description: message,
      action: {
        label: "Settings",
        onClick: () => {
          openSettings("usage");
        },
      },
      duration: 10000,
    });
    return;
  }

  toast.error("Something went wrong", {
    description: message,
    duration: 8000,
  });
}
