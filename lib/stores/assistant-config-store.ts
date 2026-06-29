"use client";

import { create } from "zustand";

import {
  DEFAULT_ASSISTANT,
  type AssistantConfig,
} from "@/lib/orin/defaults";
import { useMessagesStore } from "@/lib/stores/messages-store";

type AssistantConfigState = {
  config: AssistantConfig;
  isLoading: boolean;
  isSaving: boolean;
  isDefault: boolean;
  persisted: boolean;
  error: string | null;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  applyConfig: (
    config: AssistantConfig,
    meta?: { isDefault?: boolean; persisted?: boolean },
  ) => void;
  save: (payload: Pick<AssistantConfig, "personalitySettings" | "voiceId">) => Promise<boolean>;
  reset: () => Promise<boolean>;
};

function syncMessagesStoreAssistant(config: AssistantConfig) {
  const cache = useMessagesStore.getState().cache;
  const nextCache = { ...cache };

  for (const [id, entry] of Object.entries(cache)) {
    nextCache[id] = { ...entry, assistant: config };
  }

  useMessagesStore.setState({ cache: nextCache });
}

async function fetchAssistantConfig() {
  const response = await fetch("/api/assistant-config", { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Failed to load assistant config");
  }

  return (await response.json()) as {
    config: AssistantConfig;
    isDefault: boolean;
    persisted: boolean;
  };
}

export const useAssistantConfigStore = create<AssistantConfigState>((set, get) => ({
  config: DEFAULT_ASSISTANT,
  isLoading: true,
  isSaving: false,
  isDefault: true,
  persisted: false,
  error: null,

  init: async () => {
    set({ isLoading: true, error: null });

    try {
      const data = await fetchAssistantConfig();
      set({
        config: data.config,
        isDefault: data.isDefault,
        persisted: data.persisted,
        isLoading: false,
      });
      syncMessagesStoreAssistant(data.config);
    } catch {
      set({
        config: DEFAULT_ASSISTANT,
        isDefault: true,
        persisted: false,
        isLoading: false,
        error: "Could not load assistant settings",
      });
    }
  },

  refresh: async () => {
    try {
      const data = await fetchAssistantConfig();
      get().applyConfig(data.config, {
        isDefault: data.isDefault,
        persisted: data.persisted,
      });
      set({ error: null });
    } catch {
      // Keep showing current config on background refresh failure.
    }
  },

  applyConfig: (config, meta = {}) => {
    set({
      config,
      ...(meta.isDefault !== undefined ? { isDefault: meta.isDefault } : {}),
      ...(meta.persisted !== undefined ? { persisted: meta.persisted } : {}),
    });
    syncMessagesStoreAssistant(config);
  },

  save: async (payload) => {
    set({ isSaving: true, error: null });

    try {
      const response = await fetch("/api/assistant-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to save assistant settings");
      }

      const data = (await response.json()) as {
        config: AssistantConfig;
        persisted: boolean;
      };

      set({
        config: data.config,
        isDefault: false,
        persisted: data.persisted,
        isSaving: false,
      });
      syncMessagesStoreAssistant(data.config);
      return true;
    } catch (error) {
      set({
        isSaving: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save assistant settings",
      });
      return false;
    }
  },

  reset: async () => {
    set({ isSaving: true, error: null });

    try {
      const response = await fetch("/api/assistant-config", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to reset assistant settings");
      }

      const data = (await response.json()) as { config: AssistantConfig };

      set({
        config: data.config,
        isDefault: true,
        isSaving: false,
      });
      syncMessagesStoreAssistant(data.config);
      return true;
    } catch (error) {
      set({
        isSaving: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to reset assistant settings",
      });
      return false;
    }
  },
}));

export function useAssistantConfig() {
  return useAssistantConfigStore((state) => state.config);
}
