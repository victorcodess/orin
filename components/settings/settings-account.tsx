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

type ProfileData = {
  displayName: string;
  email: string;
  creditsBalance?: number;
};

// Cached across mounts so re-opening the panel doesn't refetch/flash a skeleton.
// Keyed by user id so it's invalidated when switching accounts.
let cachedProfile: { userId: string; data: ProfileData } | null = null;

export function SettingsAccount() {
  const user = useAuthStore((state) => state.user);
  const userId = useAuthStore((state) => state.userId);
  const syncSession = useAuthStore((state) => state.syncSession);

  const initialProfile =
    user && userId && cachedProfile?.userId === userId
      ? cachedProfile.data
      : null;

  const [profile, setProfile] = useState<ProfileData | null>(initialProfile);
  const [displayName, setDisplayName] = useState(
    initialProfile?.displayName ?? "",
  );
  const [isLoading, setIsLoading] = useState(
    Boolean(user) && initialProfile === null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (userId && cachedProfile?.userId === userId) {
      setProfile(cachedProfile.data);
      setDisplayName(cachedProfile.data.displayName);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const data = (await response.json()) as { profile: ProfileData | null };

        if (data.profile) {
          if (userId) {
            cachedProfile = { userId, data: data.profile };
          }
          setProfile(data.profile);
          setDisplayName(data.profile.displayName);
        }
      })
      .catch(() => {
        setError("Could not load account details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user, userId]);

  if (!user) {
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

  if (isLoading) {
    return <SettingsSkeletonRows count={2} />;
  }

  const handleSave = async () => {
    setSaved(false);
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim() }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to save account");
      }

      const data = (await response.json()) as { profile: ProfileData };
      if (userId) {
        cachedProfile = { userId, data: data.profile };
      }
      setProfile(data.profile);
      setDisplayName(data.profile.displayName);
      setSaved(true);
      await syncSession();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save account",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = displayName.trim() !== (profile?.displayName ?? "");

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
              value={profile?.email ?? user.email}
              disabled
              readOnly
            />
          </SettingsField>
        </div>
      </SettingsGroup>

      <SettingsActions error={error} message={saved ? "Account saved." : undefined}>
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
