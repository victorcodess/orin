"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/lib/stores/auth-store";
import { useConversationsStore } from "@/lib/stores/conversations-store";

export function StoreInit() {
  useEffect(() => {
    const unsubscribeAuth = useAuthStore.getState().init();
    const unsubscribeConversations = useConversationsStore.getState().init();

    return () => {
      unsubscribeAuth();
      unsubscribeConversations();
    };
  }, []);

  return null;
}
