"use client";

import { useQuery } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import type { UserPreferences } from "@/lib/orin/user-preferences";

export type ProfileSettings = {
  displayName: string;
  email: string;
  onboardingCompleted: boolean;
} & UserPreferences;

export type ProfilePatch = {
  displayName?: string;
  theme?: string;
  language?: string;
  messageBubbleLayout?: string;
  onboardingCompleted?: boolean;
};

function applyPatch(
  profile: ProfileSettings,
  payload: ProfilePatch,
): ProfileSettings {
  return {
    ...profile,
    ...(payload.displayName !== undefined
      ? { displayName: payload.displayName }
      : {}),
    ...(payload.theme !== undefined
      ? { theme: payload.theme as ProfileSettings["theme"] }
      : {}),
    ...(payload.language !== undefined ? { language: payload.language } : {}),
    ...(payload.messageBubbleLayout !== undefined
      ? {
          messageBubbleLayout:
            payload.messageBubbleLayout as ProfileSettings["messageBubbleLayout"],
        }
      : {}),
    ...(payload.onboardingCompleted !== undefined
      ? { onboardingCompleted: payload.onboardingCompleted }
      : {}),
  };
}

async function fetchProfile(): Promise<ProfileSettings> {
  const response = await fetch("/api/profile", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load profile");
  const data = (await response.json()) as { profile: ProfileSettings | null };
  if (!data.profile) throw new Error("Profile not found");
  return data.profile;
}

/** Reactive profile query. Only runs for authenticated users. */
export function useProfileQuery(
  userId: string | null | undefined,
): ReturnType<typeof useQuery<ProfileSettings>> {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? ""),
    queryFn: fetchProfile,
    enabled: typeof userId === "string",
    staleTime: 60_000,
  });
}

/**
 * Patch the user profile with optimistic update.
 * Safe to call outside of React components.
 *
 * @param payload - Fields to update.
 * @param userId - Current user ID (needed for the cache key).
 * @param revertSnapshot - Profile to restore on failure. Defaults to current cached value.
 * @returns The updated profile on success, null on failure.
 */
export async function patchProfile(
  payload: ProfilePatch,
  userId: string,
  revertSnapshot?: ProfileSettings | null,
): Promise<ProfileSettings | null> {
  const queryClient = getQueryClient();
  const key = queryKeys.profile(userId);
  const previous =
    revertSnapshot ?? queryClient.getQueryData<ProfileSettings>(key);

  // Optimistic update.
  if (previous) {
    queryClient.setQueryData<ProfileSettings>(key, applyPatch(previous, payload));
  }

  try {
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (previous) queryClient.setQueryData<ProfileSettings>(key, previous);
      return null;
    }

    const data = (await response.json()) as { profile: ProfileSettings };
    queryClient.setQueryData<ProfileSettings>(key, data.profile);
    return data.profile;
  } catch {
    if (previous) queryClient.setQueryData<ProfileSettings>(key, previous);
    return null;
  }
}
