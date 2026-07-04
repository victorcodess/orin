"use client";

import { useEffect } from "react";

import { useSettingsStore } from "@/lib/settings/routes";
import { useSettingsDirtyStore } from "@/lib/stores/settings-dirty-store";
import type { SettingsRoute } from "@/lib/settings/routes";

export function useSettingsRouteDirty(
  route: SettingsRoute,
  dirty: boolean,
  onDiscard: () => void,
) {
  const currentRoute = useSettingsStore((state) => state.route);
  const setActiveDirty = useSettingsDirtyStore((state) => state.setActiveDirty);

  useEffect(() => {
    if (currentRoute !== route) {
      return;
    }

    setActiveDirty(dirty, onDiscard);

    return () => {
      setActiveDirty(false, null);
    };
  }, [currentRoute, route, dirty, onDiscard, setActiveDirty]);
}
