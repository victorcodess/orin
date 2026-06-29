"use client";

import Link from "next/link";

import {
  SettingsEmptyState,
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsRow,
  SettingsSignInPrompt,
  SettingsSkeletonRows,
  SettingsStat,
} from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useProfileStore } from "@/lib/stores/profile-store";

export function SettingsUsage() {
  const userId = useAuthStore((state) => state.userId);
  const profile = useProfileStore((state) => state.profile);
  const isLoading = useProfileStore((state) => state.isLoading);

  if (userId === undefined) {
    return <SettingsSkeletonRows count={2} />;
  }

  if (userId === null) {
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
              loading={isLoading && !profile}
              value={profile?.creditsBalance ?? 0}
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
