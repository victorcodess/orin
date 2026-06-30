"use client";

import { create } from "zustand";

import { signOut as signOutAction } from "@/app/auth/actions";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";
import { useProfileStore } from "@/lib/stores/profile-store";
import { useUsageStore } from "@/lib/stores/usage-store";

export type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

type AuthState = {
  user: SidebarUser | null | undefined;
  userId: string | null | undefined;
  isLoggedIn: boolean;
  init: () => () => void;
  syncSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

type SessionPayload = {
  user: SidebarUser | null;
  userId: string | null;
};

let initialSessionFetchStarted = false;
let syncInFlight: Promise<void> | null = null;

async function fetchSession(): Promise<SessionPayload> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load session");
  }

  return (await response.json()) as SessionPayload;
}

function handleUserIdChange(nextUserId: string | null | undefined) {
  const previousUserId = useAuthStore.getState().userId;

  if (nextUserId === previousUserId) {
    return;
  }

  const isFirstResolve = previousUserId === undefined;

  if (!isFirstResolve) {
    useProfileStore.getState().reset();
    useUsageStore.getState().reset();
    void useAssistantConfigStore.getState().refresh();
  }

  if (nextUserId) {
    void useProfileStore.getState().load(nextUserId);
  }

  void useUsageStore.getState().load(nextUserId ?? "anon");
}

function applySession({ user, userId }: SessionPayload) {
  handleUserIdChange(userId);

  const profile = useProfileStore.getState().profile;
  const mergedUser =
    user && profile ? { ...user, name: profile.displayName } : user;

  setAuthState({
    user: mergedUser,
    userId,
    isLoggedIn: Boolean(user),
  });
}

function setAuthState(state: {
  user: SidebarUser | null | undefined;
  userId: string | null | undefined;
  isLoggedIn: boolean;
}) {
  useAuthStore.setState(state);
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

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  userId: undefined,
  isLoggedIn: false,

  init: () => {
    if (!initialSessionFetchStarted) {
      initialSessionFetchStarted = true;

      void fetchSession()
        .then((session) => {
          applySession(session);
        })
        .catch(() => {
          if (useAuthStore.getState().userId === undefined) {
            handleUserIdChange(null);
            set({
              user: null,
              userId: null,
              isLoggedIn: false,
            });
          }
        });
    }

    const onFocus = () => {
      void useAuthStore.getState().syncSession();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  },

  syncSession: async () => {
    if (syncInFlight) {
      return syncInFlight;
    }

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
    set({
      user: null,
      userId: null,
      isLoggedIn: false,
    });
  },
}));

export function useIsLoggedIn() {
  return useAuthStore((state) => state.isLoggedIn);
}
