import { describe, expect, it } from "vitest";

import {
  QuotaBlockedError,
  isQuotaBlockedError,
  quotaBlockedResponse,
} from "@/lib/quotas/errors";

describe("QuotaBlockedError", () => {
  it("carries stable API metadata and response shape", async () => {
    const error = new QuotaBlockedError(
      "Free allowance used.",
      "signup_required",
      "signup",
    );

    expect(error).toMatchObject({
      name: "QuotaBlockedError",
      code: "signup_required",
      action: "signup",
      status: 402,
    });
    expect(isQuotaBlockedError(error)).toBe(true);
    expect(isQuotaBlockedError(new Error("nope"))).toBe(false);

    const keysError = new QuotaBlockedError(
      "Add your OpenAI API key in Settings to continue.",
      "keys_required",
      "add_keys",
    );
    const response = quotaBlockedResponse(keysError);

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: keysError.message,
      code: "keys_required",
      action: "add_keys",
    });
  });
});
