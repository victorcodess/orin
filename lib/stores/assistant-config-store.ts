"use client";

import { useQuery } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import {
  DEFAULT_ASSISTANT,
  type AssistantConfig,
} from "@/lib/orin/defaults";

type AssistantConfigResponse = {
  config: AssistantConfig;
  isDefault: boolean;
  persisted: boolean;
};

export async function fetchAssistantConfig(): Promise<AssistantConfigResponse> {
  const response = await fetch("/api/assistant-config", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load assistant config");
  return (await response.json()) as AssistantConfigResponse;
}

/** Reactive assistant config query — always enabled (works for anon users too). */
export function useAssistantConfigQuery(): ReturnType<
  typeof useQuery<AssistantConfigResponse>
> {
  return useQuery({
    queryKey: queryKeys.assistantConfig(),
    queryFn: fetchAssistantConfig,
    staleTime: 60_000,
    // Provide a safe default so the UI never hangs on a missing config.
    placeholderData: {
      config: DEFAULT_ASSISTANT,
      isDefault: true,
      persisted: false,
    },
  });
}

/** Sugar hook — returns just the config value, falling back to the default. */
export function useAssistantConfig(): AssistantConfig {
  const { data } = useAssistantConfigQuery();
  return data?.config ?? DEFAULT_ASSISTANT;
}

/**
 * Save a new assistant config.
 * Optimistically updates the TQ cache, rolls back on failure.
 * Returns true on success, false on error.
 */
export async function saveAssistantConfig(
  payload: AssistantConfig,
): Promise<boolean> {
  const queryClient = getQueryClient();
  const key = queryKeys.assistantConfig();
  const previous = queryClient.getQueryData<AssistantConfigResponse>(key);

  // Optimistic update.
  queryClient.setQueryData<AssistantConfigResponse>(key, (old) => ({
    config: payload,
    isDefault: false,
    persisted: old?.persisted ?? false,
  }));

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
      if (previous) queryClient.setQueryData(key, previous);
      throw new Error(body?.error ?? "Failed to save assistant settings");
    }

    const data = (await response.json()) as {
      config: AssistantConfig;
      persisted: boolean;
    };
    queryClient.setQueryData<AssistantConfigResponse>(key, {
      config: data.config,
      isDefault: false,
      persisted: data.persisted,
    });
    return true;
  } catch (error) {
    if (previous) queryClient.setQueryData(key, previous);
    throw error;
  }
}

/**
 * Reset assistant config to the platform default.
 * Returns true on success, false on error.
 */
export async function resetAssistantConfig(): Promise<boolean> {
  const queryClient = getQueryClient();
  const key = queryKeys.assistantConfig();
  const previous = queryClient.getQueryData<AssistantConfigResponse>(key);

  // Optimistic update.
  queryClient.setQueryData<AssistantConfigResponse>(key, {
    config: DEFAULT_ASSISTANT,
    isDefault: true,
    persisted: false,
  });

  try {
    const response = await fetch("/api/assistant-config", {
      method: "DELETE",
    });

    if (!response.ok) {
      if (previous) queryClient.setQueryData(key, previous);
      throw new Error("Failed to reset assistant settings");
    }

    const data = (await response.json()) as { config: AssistantConfig };
    queryClient.setQueryData<AssistantConfigResponse>(key, {
      config: data.config,
      isDefault: true,
      persisted: false,
    });
    return true;
  } catch (error) {
    if (previous) queryClient.setQueryData(key, previous);
    throw error;
  }
}

