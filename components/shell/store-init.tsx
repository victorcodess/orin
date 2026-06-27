"use client";

import { useEffect } from "react";

import { prefetchDictationToken } from "@/lib/elevenlabs/scribe-token-client";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useConversationsStore } from "@/lib/stores/conversations-store";
import { initMessageStyleStore } from "@/lib/stores/message-style-store";
import { useSettingsStore } from "@/lib/settings-routes";

export function StoreInit() {
  useEffect(() => {
    prefetchDictationToken();
    initMessageStyleStore();
    void useAssistantConfigStore.getState().init();

    const unsubscribeAuth = useAuthStore.getState().init();
    const unsubscribeConversations = useConversationsStore.getState().init();
    const unsubscribeSettings = useSettingsStore.getState().init();

    return () => {
      unsubscribeAuth();
      unsubscribeConversations();
      unsubscribeSettings();
    };
  }, []);

  return null;
}
