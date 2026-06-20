"use client";

import { useEffect } from "react";

import { warmDictation } from "@/lib/elevenlabs/scribe-token-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useConversationsStore } from "@/lib/stores/conversations-store";

export function StoreInit() {
  useEffect(() => {
    warmDictation();

    const unsubscribeAuth = useAuthStore.getState().init();
    const unsubscribeConversations = useConversationsStore.getState().init();

    return () => {
      unsubscribeAuth();
      unsubscribeConversations();
    };
  }, []);

  return null;
}
