import type { FetchFunction } from "@ai-sdk/provider-utils";

import { readErrorResponse } from "@/lib/quotas/client-errors";

const CLIENT_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const chatFetch: FetchFunction = async (input, init) => {
  const headers = new Headers(init?.headers);
  headers.set("X-User-Timezone", CLIENT_TIME_ZONE);

  const response = await fetch(input, { ...init, headers });

  if (!response.ok) {
    throw await readErrorResponse(response);
  }

  return response;
};
