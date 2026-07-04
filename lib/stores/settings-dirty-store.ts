"use client";

import { create } from "zustand";

import type { SettingsPendingNavigation } from "@/lib/settings/routes";

type SettingsDirtyState = {
  dirty: boolean;
  discard: (() => void) | null;
  pendingNavigation: SettingsPendingNavigation | null;
  setActiveDirty: (dirty: boolean, discard: (() => void) | null) => void;
  setPendingNavigation: (navigation: SettingsPendingNavigation | null) => void;
  confirmDiscard: () => SettingsPendingNavigation | null;
  cancelNavigation: () => void;
};

export const useSettingsDirtyStore = create<SettingsDirtyState>((set, get) => ({
  dirty: false,
  discard: null,
  pendingNavigation: null,

  setActiveDirty: (dirty, discard) => {
    set({ dirty, discard });
  },

  setPendingNavigation: (navigation) => {
    set({ pendingNavigation: navigation });
  },

  confirmDiscard: () => {
    const pendingNavigation = get().pendingNavigation;
    get().discard?.();
    set({ dirty: false, discard: null, pendingNavigation: null });
    return pendingNavigation;
  },

  cancelNavigation: () => {
    set({ pendingNavigation: null });
  },
}));
