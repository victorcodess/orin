import type { FetchFunction } from "@ai-sdk/provider-utils";

import { readErrorResponse } from "@/lib/quotas/client-errors";

export const chatFetch: FetchFunction = async (input, init) => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw await readErrorResponse(response);
  }

  return response;
};
