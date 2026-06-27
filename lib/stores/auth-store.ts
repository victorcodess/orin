"use client";

import { create } from "zustand";

import { signOut as signOutAction } from "@/app/auth/actions";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";

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

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  userId: undefined,
  isLoggedIn: false,

  init: () => {
    void fetchSession()
      .then(({ user, userId }) => {
        set({
          user,
          userId,
          isLoggedIn: Boolean(user),
        });
        void useAssistantConfigStore.getState().refresh();
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
      set({
        user,
        userId,
        isLoggedIn: Boolean(user),
      });
      void useAssistantConfigStore.getState().refresh();
    } catch {
      set({
        user: null,
        userId: null,
        isLoggedIn: false,
      });
    }
  },

  signOut: async () => {
    await signOutAction();
    set({
      user: null,
      userId: null,
      isLoggedIn: false,
    });
    void useAssistantConfigStore.getState().refresh();
  },
}));

export function useIsLoggedIn() {
  return useAuthStore((state) => state.isLoggedIn);
}
