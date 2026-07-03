import type { FetchFunction } from "@ai-sdk/provider-utils";

import { getClientPromptContext } from "@/lib/prompt-context/client";
import { readErrorResponse } from "@/lib/quotas/client-errors";

export const chatFetch: FetchFunction = async (input, init) => {
  let requestInit = init;

  if (init?.body && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body) as Record<string, unknown>;
      requestInit = {
        ...init,
        body: JSON.stringify({
          ...body,
          promptContext: getClientPromptContext(),
        }),
      };
    } catch {
      // Leave the body unchanged if it isn't JSON.
    }
  }

  const response = await fetch(input, requestInit);

  if (!response.ok) {
    throw await readErrorResponse(response);
  }

  return response;
};
