import type { FetchFunction } from "@ai-sdk/provider-utils";

export const chatFetch: FetchFunction = async (input, init) => {
  const response = await fetch(input, init);

  if (!response.ok) {
    let message = `Chat request failed (${response.status})`;

    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Response body wasn't JSON — keep default message.
    }

    throw new Error(message);
  }

  return response;
};
