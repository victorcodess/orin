"use client";

import { create } from "zustand";

import type { QuotaUsageSummary } from "@/lib/quotas/types";

export type UsageCacheKey = string | "anon";

type UsageState = {
  cacheKey: UsageCacheKey | null;
  usage: QuotaUsageSummary | null;
  isLoading: boolean;
  error: string | null;
  load: (cacheKey: UsageCacheKey) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
};

let inflight: Promise<void> | null = null;

async function fetchUsage(
  cacheKey: UsageCacheKey,
  get: () => UsageState,
  set: (partial: Partial<UsageState>) => void,
  options?: { keepLoading?: boolean },
): Promise<void> {
  try {
    const response = await fetch("/api/usage", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Failed to load usage");
    }

    const data = (await response.json()) as { usage: QuotaUsageSummary };

    if (get().cacheKey === cacheKey) {
      set({ usage: data.usage, isLoading: false, error: null });
    }
  } catch (error) {
    if (get().cacheKey === cacheKey) {
      set({
        ...(options?.keepLoading ? {} : { isLoading: false }),
        error: error instanceof Error ? error.message : "Failed to load usage",
      });
    }
  } finally {
    inflight = null;
  }
}

export const useUsageStore = create<UsageState>((set, get) => ({
  cacheKey: null,
  usage: null,
  isLoading: false,
  error: null,

  reset: () => {
    inflight = null;
    set({ cacheKey: null, usage: null, isLoading: false, error: null });
  },

  load: async (cacheKey) => {
    const state = get();

    if (state.cacheKey === cacheKey && state.usage) {
      return;
    }

    if (state.cacheKey === cacheKey && inflight) {
      return inflight;
    }

    set({
      cacheKey,
      usage: state.cacheKey === cacheKey ? state.usage : null,
      isLoading: true,
      error: null,
    });

    inflight = fetchUsage(cacheKey, get, set);
    return inflight;
  },

  refresh: async () => {
    const cacheKey = get().cacheKey;

    if (!cacheKey || inflight) {
      return inflight ?? undefined;
    }

    inflight = fetchUsage(cacheKey, get, set, { keepLoading: true });
    return inflight;
  },
}));
