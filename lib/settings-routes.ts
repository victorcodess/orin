"use client";

import { create } from "zustand";

export type SettingsRoute =
  | "general"
  | "personalization"
  | "account"
  | "voice"
  | "usage";

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
    id: "voice",
    label: "Voice",
    hash: "#settings/voice",
    title: "Voice",
    description: "Choose Orin's voice for read-aloud and calls.",
  },
  {
    id: "usage",
    label: "Usage & API keys",
    hash: "#settings/usage",
    title: "Usage & API keys",
    description: "Credits, usage, and developer access.",
  },
];

const LEGACY_ROUTE_ALIASES: Record<string, SettingsRoute> = {
  profile: "account",
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

    set({ route: parseSettingsHash(window.location.hash) });
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
  useSettingsStore.getState().open(route);
}

export function closeSettings() {
  useSettingsStore.getState().close();
}
