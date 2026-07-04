import { QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30s. After that, TQ may refetch in background.
        staleTime: 30_000,
        // Retry once on transient failures, then surface the error.
        retry: 1,
        // Auth-store handles window-focus session sync separately;
        // individual queries opt in via their own refetchOnWindowFocus setting.
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Returns the singleton QueryClient. Safe to call outside of React
 * (e.g. from Zustand store callbacks, utility functions).
 * On the server a new instance is returned each call (SSR-safe).
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
