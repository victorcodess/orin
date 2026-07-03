"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

import { prefetchDictationToken } from "@/lib/elevenlabs/scribe-token-client";
import { useSettingsStore } from "@/lib/settings-routes";
import { useAuthStore } from "@/lib/stores/auth-store";
import {
  initMessageStyleStore,
  useMessageStyleStore,
} from "@/lib/stores/message-style-store";
import { useProfileQuery } from "@/lib/stores/profile-store";
import { syncAuthDisplayName } from "@/lib/user-display-name";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { fetchAssistantConfig } from "@/lib/stores/assistant-config-store";

function ProfilePreferencesSync() {
  const userId = useAuthStore((state) => state.userId);
  const { data: profile } = useProfileQuery(userId);
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
    syncAuthDisplayName(profile.displayName);
  }, [userId, profile, setTheme, setLayout]);

  return null;
}

export function StoreInit() {
  useEffect(() => {
    prefetchDictationToken();
    initMessageStyleStore();

    // Eagerly prefetch assistant config so it's ready before any chat page loads.
    void getQueryClient().prefetchQuery({
      queryKey: queryKeys.assistantConfig(),
      queryFn: fetchAssistantConfig,
      staleTime: 60_000,
    });

    const unsubscribeAuth = useAuthStore.getState().init();
    const unsubscribeSettings = useSettingsStore.getState().init();

    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  return <ProfilePreferencesSync />;
}
