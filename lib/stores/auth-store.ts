"use client";

import { create } from "zustand";

import { signOut as signOutAction } from "@/app/auth/actions";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";
import { useProfileStore } from "@/lib/stores/profile-store";

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

async function fetchSession() {
  const response = await fetch("/api/auth/session", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load session");
  }

  return (await response.json()) as {
    user: SidebarUser | null;
    userId: string | null;
  };
}

function handleUserIdChange(nextUserId: string | null | undefined) {
  const previousUserId = useAuthStore.getState().userId;

  if (nextUserId === previousUserId) {
    return;
  }

  const isFirstResolve = previousUserId === undefined;

  if (!isFirstResolve) {
    useProfileStore.getState().reset();
    void useAssistantConfigStore.getState().refresh();
  }

  if (nextUserId && (isFirstResolve || nextUserId !== previousUserId)) {
    void useProfileStore.getState().load(nextUserId);
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  userId: undefined,
  isLoggedIn: false,

  init: () => {
    void fetchSession()
      .then(({ user, userId }) => {
        handleUserIdChange(userId);
        set({
          user,
          userId,
          isLoggedIn: Boolean(user),
        });
      })
      .catch(() => {
        set({
          user: null,
          userId: null,
          isLoggedIn: false,
        });
      });

    const onFocus = () => {
      void useAuthStore.getState().syncSession();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  },

  syncSession: async () => {
    try {
      const { user, userId } = await fetchSession();
      handleUserIdChange(userId);
      set({
        user,
        userId,
        isLoggedIn: Boolean(user),
      });
    } catch {
      // Keep the current session on transient network errors.
    }
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
