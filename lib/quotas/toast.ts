"use client";

import { buildLoginHrefFromHere } from "@/lib/auth/return-url";
import { toast } from "@/components/nexus-ui/toaster";
import { openSettings } from "@/lib/settings/routes";
import type { FetchError } from "@/lib/quotas/client-errors";

export function toastQuotaError(error: FetchError | Error) {
  const fetchError = error as FetchError;
  const code = fetchError.code;
  const action = fetchError.action;
  const message = error.message;

  if (code === "signup_required" || code === "feature_requires_auth" || action === "signup") {
    toast.error("Free allowance used", {
      description: message,
      action: {
        label: "Sign up",
        onClick: () => {
          window.location.href = buildLoginHrefFromHere("signup");
        },
      },
      duration: 10000,
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
