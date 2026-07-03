"use client";

import { useQuery } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import type { QuotaUsageSummary } from "@/lib/quotas/types";

async function fetchUsage(): Promise<QuotaUsageSummary> {
  const response = await fetch("/api/usage", { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load usage");
  const data = (await response.json()) as { usage: QuotaUsageSummary };
  return data.usage;
}

/**
 * Reactive usage query. Enabled whenever the session has resolved
 * (userId !== undefined), covering both anon and logged-in users.
 */
export function useUsageQuery(
  userId: string | null | undefined,
): ReturnType<typeof useQuery<QuotaUsageSummary>> {
  return useQuery({
    queryKey: queryKeys.usage(),
    queryFn: fetchUsage,
    enabled: userId !== undefined,
    // Refetch on window focus so usage reflects recent API activity.
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

/** Trigger a fresh usage fetch after a mutation (e.g. saving/clearing API keys). */
export function invalidateUsage() {
  void getQueryClient().invalidateQueries({ queryKey: queryKeys.usage() });
}
