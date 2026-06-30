"use client";

import { create } from "zustand";

import type { UserPreferences } from "@/lib/orin/user-preferences";
import { syncAuthDisplayName } from "@/lib/user-display-name";

export type ProfileSettings = {
  displayName: string;
  email: string;
  onboardingCompleted: boolean;
} & UserPreferences;

type ProfilePatch = {
  displayName?: string;
  theme?: string;
  language?: string;
  messageBubbleLayout?: string;
  onboardingCompleted?: boolean;
};

type ProfileState = {
  userId: string | null;
  profile: ProfileSettings | null;
  isLoading: boolean;
  error: string | null;
  load: (userId: string) => Promise<void>;
  patch: (
    payload: ProfilePatch,
    revertSnapshot?: ProfileSettings | null,
  ) => Promise<ProfileSettings | null>;
  reset: () => void;
};

let inflight: Promise<void> | null = null;

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

export const useProfileStore = create<ProfileState>((set, get) => ({
  userId: null,
  profile: null,
  isLoading: false,
  error: null,

  reset: () => {
    inflight = null;
    set({ userId: null, profile: null, isLoading: false, error: null });
  },

  load: async (userId) => {
    const state = get();
    if (state.userId === userId && state.profile) {
      return;
    }

    if (state.userId === userId && inflight) {
      return inflight;
    }

    set({ userId, isLoading: true, error: null });

    inflight = (async () => {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }

        const data = (await response.json()) as {
          profile: ProfileSettings | null;
        };

        if (!data.profile) {
          throw new Error("Profile not found");
        }

        if (get().userId === userId) {
          set({ profile: data.profile, isLoading: false });
          syncAuthDisplayName(data.profile.displayName);
        }
      } catch (error) {
        if (get().userId === userId) {
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load profile",
          });
        }
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  },

  patch: async (payload, revertSnapshot) => {
    const previous = revertSnapshot ?? get().profile;
    const current = get().profile;

    if (current) {
      set({ profile: applyPatch(current, payload) });
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (previous) {
        set({ profile: previous });
      }
      return null;
    }

    const data = (await response.json()) as { profile: ProfileSettings };
    set({ profile: data.profile });
    syncAuthDisplayName(data.profile.displayName);
    return data.profile;
  },
}));
