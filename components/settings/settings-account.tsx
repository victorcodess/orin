"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  SettingsActions,
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsSignInPrompt,
  SettingsSkeletonRows,
} from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useProfileStore } from "@/lib/stores/profile-store";

export function SettingsAccount() {
  const userId = useAuthStore((state) => state.userId);
  const user = useAuthStore((state) => state.user);
  const profile = useProfileStore((state) => state.profile);
  const isLoading = useProfileStore((state) => state.isLoading);
  const error = useProfileStore((state) => state.error);
  const patch = useProfileStore((state) => state.patch);
  const syncSession = useAuthStore((state) => state.syncSession);

  const serverName = profile?.displayName ?? user?.name ?? "";
  const [displayName, setDisplayName] = useState(serverName);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setDisplayName(serverName);
    }
  }, [serverName, isDirty]);

  if (userId === undefined) {
    return <SettingsSkeletonRows count={2} />;
  }

  if (userId === null) {
    return (
      <SettingsPage>
        <SettingsSignInPrompt
          title="Sign in to manage your account"
          description="Personalization and voice settings work without an account. Account settings require sign in."
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

  if (isLoading && !profile) {
    return <SettingsSkeletonRows count={2} />;
  }

  const handleSave = async () => {
    setSaved(false);
    setSaveError(null);
    setIsSaving(true);

    try {
      const updated = await patch({ displayName: displayName.trim() });

      if (!updated) {
        throw new Error("Failed to save account");
      }

      setDisplayName(updated.displayName);
      setIsDirty(false);
      setSaved(true);
      await syncSession();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save account");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <div className="flex flex-col gap-4 px-4 py-4">
          <SettingsField
            label="Display name"
            description="Shown in the sidebar and account menu."
            htmlFor="account-display-name"
          >
            <Input
              id="account-display-name"
              value={displayName}
              maxLength={64}
              onChange={(event) => {
                setSaved(false);
                setIsDirty(true);
                setDisplayName(event.target.value);
              }}
            />
          </SettingsField>

          <SettingsField
            label="Email"
            description="Your sign-in email address."
            htmlFor="account-email"
          >
            <Input
              id="account-email"
              value={profile?.email ?? user?.email ?? ""}
              disabled
              readOnly
            />
          </SettingsField>
        </div>
      </SettingsGroup>

      <SettingsActions
        error={saveError ?? error}
        message={saved ? "Account saved." : undefined}
      >
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </SettingsActions>
    </SettingsPage>
  );
}
