"use client";

import { useEffect } from "react";

import { prefetchDictationToken } from "@/lib/elevenlabs/scribe-token-client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useConversationsStore } from "@/lib/stores/conversations-store";
import { initMessageStyleStore } from "@/lib/stores/message-style-store";

export function StoreInit() {
  useEffect(() => {
    prefetchDictationToken();
    initMessageStyleStore();

    const unsubscribeAuth = useAuthStore.getState().init();
    const unsubscribeConversations = useConversationsStore.getState().init();

    return () => {
      unsubscribeAuth();
      unsubscribeConversations();
    };
  }, []);

  return null;
}
