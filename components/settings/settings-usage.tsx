"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  SettingsEmptyState,
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsRow,
  SettingsSignInPrompt,
  SettingsStat,
} from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";

type UsageData = {
  creditsBalance: number;
  email: string;
};

export function SettingsUsage() {
  const user = useAuthStore((state) => state.user);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    void fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load usage");
        }

        const data = (await response.json()) as {
          profile: {
            creditsBalance?: number;
            email: string;
          } | null;
        };

        if (data.profile) {
          setUsage({
            creditsBalance: data.profile.creditsBalance ?? 0,
            email: data.profile.email,
          });
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <SettingsPage>
        <SettingsSignInPrompt
          title="Sign in to view usage"
          description="Track credits and usage across devices. API keys will arrive in Phase 5."
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/sign-up">Create account</Link>
          </Button>
        </div>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <SettingsRow title="Credits" description="Remaining balance for chat and voice.">
          <div className="flex flex-col gap-3">
            <SettingsStat
              loading={isLoading}
              value={usage?.creditsBalance ?? 0}
              label="Free tier"
            />
            <Button asChild variant="outline" size="sm" className="w-fit">
              <Link href="/upgrade">Upgrade plan</Link>
            </Button>
          </div>
        </SettingsRow>

        <SettingsRow
          title="Usage history"
          description="Detailed usage tracking arrives in Phase 4."
          withSeparator
        >
          <SettingsEmptyState>No usage events to show yet.</SettingsEmptyState>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup>
        <div className="px-4 py-4">
          <SettingsField
            label="API keys"
            description="Create keys to access Orin programmatically. Coming in Phase 5."
          >
            <SettingsEmptyState>
              API key management is not available yet.
            </SettingsEmptyState>
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" disabled>
                Create API key
              </Button>
            </div>
          </SettingsField>
        </div>
      </SettingsGroup>
    </SettingsPage>
  );
}
