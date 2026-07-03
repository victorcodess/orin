"use client";

import { create } from "zustand";

import { signOut as signOutAction } from "@/app/auth/actions";
import { getQueryClient } from "@/lib/query-client";

export type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

type AuthState = {
  user: SidebarUser | null | undefined;
  userId: string | null | undefined;
  onboardingCompleted: boolean | null | undefined;
  isLoggedIn: boolean;
  init: () => () => void;
  syncSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

type SessionPayload = {
  user: SidebarUser | null;
  userId: string | null;
  onboardingCompleted: boolean | null;
};

let initialSessionFetchStarted = false;
let syncInFlight: Promise<void> | null = null;

async function fetchSession(): Promise<SessionPayload> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load session");
  return (await response.json()) as SessionPayload;
}

/**
 * Called whenever the resolved userId changes.
 * Clears the entire TQ cache so all queries re-fetch for the new identity.
 */
function handleUserIdChange(nextUserId: string | null | undefined) {
  const previousUserId = useAuthStore.getState().userId;
  if (nextUserId === previousUserId) return;

  // Clear all server-state caches on any auth change.
  // Queries that are mounted will automatically refetch.
  getQueryClient().clear();
}

function applySession(
  { user, userId, onboardingCompleted }: SessionPayload,
  options?: { skipUserIdChange?: boolean },
) {
  if (!options?.skipUserIdChange) {
    handleUserIdChange(userId);
  }

  useAuthStore.setState({
    user,
    userId,
    onboardingCompleted,
    isLoggedIn: Boolean(user),
  });
}

async function resolveSessionForSync(): Promise<SessionPayload> {
  const current = useAuthStore.getState();
  let session = await fetchSession();

  // getUser() can briefly return null during token refresh; retry before demoting.
  if (session.userId === null && current.userId) {
    await new Promise((resolve) => setTimeout(resolve, 150));
    session = await fetchSession();
  }

  return session;
}

/** Seed session from the onboarding bridge without triggering a cache clear. */
export function hydrateOnboardingSession(session: SessionPayload) {
  initialSessionFetchStarted = true;
  applySession(session, { skipUserIdChange: true });
}

export const useAuthStore = create<AuthState>(() => ({
  user: undefined,
  userId: undefined,
  onboardingCompleted: undefined,
  isLoggedIn: false,

  init: () => {
    if (!initialSessionFetchStarted) {
      initialSessionFetchStarted = true;

      if (useAuthStore.getState().userId === undefined) {
        void fetchSession()
          .then((session) => {
            applySession(session);
          })
          .catch(() => {
            if (useAuthStore.getState().userId === undefined) {
              handleUserIdChange(null);
              useAuthStore.setState({
                user: null,
                userId: null,
                onboardingCompleted: null,
                isLoggedIn: false,
              });
            }
          });
      }
    }

    const onFocus = () => {
      void useAuthStore.getState().syncSession();
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  },

  syncSession: async () => {
    if (syncInFlight) return syncInFlight;

    syncInFlight = (async () => {
      try {
        const session = await resolveSessionForSync();
        applySession(session);
      } catch {
        // Keep the current session on transient network errors.
      } finally {
        syncInFlight = null;
      }
    })();

    return syncInFlight;
  },

  signOut: async () => {
    await signOutAction();
    handleUserIdChange(null);
    useAuthStore.setState({
      user: null,
      userId: null,
      onboardingCompleted: null,
      isLoggedIn: false,
    });
  },
}));

export function useIsLoggedIn() {
  return useAuthStore((state) => state.isLoggedIn);
}
