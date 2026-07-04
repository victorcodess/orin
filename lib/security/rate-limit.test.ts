import { afterEach, describe, expect, it } from "vitest";

import { checkApiRateLimit, resetRateLimits } from "@/lib/security/rate-limit";

describe("checkApiRateLimit", () => {
  afterEach(() => {
    resetRateLimits();
  });

  it("allows requests under the chat limit", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4" });
    const request = {
      pathname: "/api/chat",
      method: "POST",
      headers,
    };

    for (let i = 0; i < 24; i += 1) {
      expect(checkApiRateLimit(request).ok).toBe(true);
    }

    expect(checkApiRateLimit(request).ok).toBe(false);
  });

  it("ignores non-api routes", () => {
    expect(
      checkApiRateLimit({
        pathname: "/new",
        method: "GET",
        headers: new Headers(),
      }).ok,
    ).toBe(true);
  });
});
