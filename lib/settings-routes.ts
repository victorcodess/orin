"use client";

import { create } from "zustand";

import { useSettingsDirtyStore } from "@/lib/stores/settings-dirty-store";

export type SettingsRoute = "general" | "personalization" | "account" | "usage";

export const SETTINGS_HASH_PREFIX = "settings";

export const DEFAULT_SETTINGS_ROUTE: SettingsRoute = "general";

export const SETTINGS_ROUTES: {
  id: SettingsRoute;
  label: string;
  hash: string;
  title: string;
  description: string;
}[] = [
  {
    id: "general",
    label: "General",
    hash: "#settings/general",
    title: "General",
    description: "Theme, language, and app preferences.",
  },
  {
    id: "personalization",
    label: "Personalization",
    hash: "#settings/personalization",
    title: "Personalization",
    description: "Customize how Orin speaks and responds.",
  },
  {
    id: "account",
    label: "Account",
    hash: "#settings/account",
    title: "Account",
    description: "Manage your account details.",
  },
  {
    id: "usage",
    label: "Usage & API keys",
    hash: "#settings/usage",
    title: "Usage & API keys",
    description: "Free allowance, access status, and your API keys.",
  },
];

const LEGACY_ROUTE_ALIASES: Record<string, SettingsRoute> = {
  profile: "account",
  voice: "personalization",
};

export function parseSettingsHash(hash: string): SettingsRoute | null {
  const normalized = hash.replace(/^#/, "");

  if (normalized === SETTINGS_HASH_PREFIX) {
    return DEFAULT_SETTINGS_ROUTE;
  }

  if (!normalized.startsWith(`${SETTINGS_HASH_PREFIX}/`)) {
    return null;
  }

  const segment = normalized.slice(`${SETTINGS_HASH_PREFIX}/`.length);
  const route = (LEGACY_ROUTE_ALIASES[segment] ?? segment) as SettingsRoute;

  if (SETTINGS_ROUTES.some((item) => item.id === route)) {
    return route;
  }

  return null;
}

export function settingsHashForRoute(route: SettingsRoute): string {
  return `#${SETTINGS_HASH_PREFIX}/${route}`;
}

export function getSettingsRouteMeta(route: SettingsRoute) {
  return SETTINGS_ROUTES.find((item) => item.id === route)!;
}

export type SettingsPendingNavigation =
  | { type: "route"; route: SettingsRoute }
  | { type: "close" };

function executeSettingsNavigation(navigation: SettingsPendingNavigation) {
  if (navigation.type === "close") {
    useSettingsStore.getState().close();
    return;
  }

  useSettingsStore.getState().open(navigation.route);
}

export function attemptSettingsNavigation(
  navigation: SettingsPendingNavigation,
) {
  const currentRoute = useSettingsStore.getState().route;

  if (currentRoute && useSettingsDirtyStore.getState().dirty) {
    useSettingsDirtyStore.getState().setPendingNavigation(navigation);
    return;
  }

  executeSettingsNavigation(navigation);
}

export function confirmSettingsDiscardNavigation() {
  const pending = useSettingsDirtyStore.getState().confirmDiscard();

  if (pending) {
    executeSettingsNavigation(pending);
  }
}

type SettingsState = {
  route: SettingsRoute | null;
  init: () => () => void;
  syncFromHash: () => void;
  open: (route: SettingsRoute) => void;
  close: () => void;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  route: null,

  syncFromHash: () => {
    if (typeof window === "undefined") {
      return;
    }

    const nextRoute = parseSettingsHash(window.location.hash);
    const currentRoute = get().route;

    if (
      currentRoute &&
      nextRoute !== currentRoute &&
      useSettingsDirtyStore.getState().dirty
    ) {
      const { pathname, search } = window.location;
      history.replaceState(
        null,
        "",
        `${pathname}${search}${settingsHashForRoute(currentRoute)}`,
      );
      useSettingsDirtyStore.getState().setPendingNavigation(
        nextRoute ? { type: "route", route: nextRoute } : { type: "close" },
      );
      return;
    }

    set({ route: nextRoute });
  },

  init: () => {
    get().syncFromHash();

    const handleSync = () => {
      get().syncFromHash();
    };

    window.addEventListener("hashchange", handleSync);

    return () => {
      window.removeEventListener("hashchange", handleSync);
    };
  },

  open: (route) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHash = settingsHashForRoute(route).slice(1);
    const currentHash = window.location.hash.replace(/^#/, "");

    if (currentHash !== nextHash) {
      window.location.hash = nextHash;
    }

    set({ route });
  },

  close: () => {
    if (typeof window === "undefined") {
      return;
    }

    const { pathname, search, hash } = window.location;

    if (hash) {
      history.replaceState(null, "", `${pathname}${search}`);
    }

    set({ route: null });
  },
}));

export function isSettingsPanelOpen() {
  return useSettingsStore.getState().route !== null;
}

export function openSettings(route: SettingsRoute = DEFAULT_SETTINGS_ROUTE) {
  const currentRoute = useSettingsStore.getState().route;

  if (currentRoute === null) {
    useSettingsStore.getState().open(route);
    return;
  }

  attemptSettingsNavigation({ type: "route", route });
}

export function closeSettings() {
  const currentRoute = useSettingsStore.getState().route;

  if (currentRoute === null) {
    return;
  }

  attemptSettingsNavigation({ type: "close" });
}
