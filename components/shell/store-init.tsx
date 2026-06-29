"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { prefetchDictationToken } from "@/lib/elevenlabs/scribe-token-client";
import { useSettingsStore } from "@/lib/settings-routes";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useConversationsStore } from "@/lib/stores/conversations-store";
import { useProfileStore } from "@/lib/stores/profile-store";
import {
  initMessageStyleStore,
  useMessageStyleStore,
} from "@/lib/stores/message-style-store";

function ProfilePreferencesSync() {
  const userId = useAuthStore((state) => state.userId);
  const profile = useProfileStore((state) => state.profile);
  const { setTheme } = useTheme();
  const setLayout = useMessageStyleStore((state) => state.setLayout);
  const syncedUser = useRef<string | null>(null);

  useEffect(() => {
    if (userId === undefined || userId === null) {
      syncedUser.current = null;
      return;
    }

    if (!profile || syncedUser.current === userId) {
      return;
    }

    syncedUser.current = userId;
    setTheme(profile.theme);
    setLayout(profile.messageBubbleLayout);
  }, [userId, profile, setTheme, setLayout]);

  return null;
}

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

  return <ProfilePreferencesSync />;
}
