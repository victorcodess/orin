"use client";

import type { User } from "@supabase/supabase-js";
import { create } from "zustand";

import { createClient } from "@/lib/supabase/client";

export type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
};

function toSidebarUser(authUser: User): SidebarUser {
  return {
    name:
      (authUser.user_metadata?.full_name as string | undefined) ??
      authUser.email?.split("@")[0] ??
      "User",
    email: authUser.email ?? "",
    avatar: (authUser.user_metadata?.avatar_url as string | undefined) ?? "",
  };
}

type AuthState = {
  user: SidebarUser | null | undefined;
  userId: string | null | undefined;
  isLoggedIn: boolean;
  init: () => () => void;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: undefined,
  userId: undefined,
  isLoggedIn: false,

  init: () => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      const authUser = data.user;

      set({
        user: authUser ? toSidebarUser(authUser) : null,
        userId: authUser?.id ?? null,
        isLoggedIn: Boolean(authUser),
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user;

      set({
        user: authUser ? toSidebarUser(authUser) : null,
        userId: authUser?.id ?? null,
        isLoggedIn: Boolean(authUser),
      });
    });

    return () => subscription.unsubscribe();
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  },
}));

export function useIsLoggedIn() {
  return useAuthStore((state) => state.isLoggedIn);
}
