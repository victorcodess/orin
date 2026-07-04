import { describe, expect, it } from "vitest";

import {
  FetchError,
  isFetchError,
  parseApiErrorBody,
} from "@/lib/quotas/client-errors";

describe("parseApiErrorBody", () => {
  it("returns empty object for invalid bodies", () => {
    expect(parseApiErrorBody(null)).toEqual({});
    expect(parseApiErrorBody("nope")).toEqual({});
  });

  it("parses known quota error codes and actions", () => {
    expect(
      parseApiErrorBody({
        error: "Free allowance used.",
        code: "signup_required",
        action: "signup",
      }),
    ).toEqual({
      error: "Free allowance used.",
      code: "signup_required",
      action: "signup",
    });
  });

  it("drops unknown codes and actions", () => {
    expect(
      parseApiErrorBody({
        error: "Bad request",
        code: "unknown_code",
        action: "pay_now",
      }),
    ).toEqual({
      error: "Bad request",
      code: undefined,
      action: undefined,
    });
  });
});

describe("FetchError", () => {
  it("preserves status, code, and action", () => {
    const error = new FetchError("Add keys", 402, "keys_required", "add_keys");

    expect(error).toMatchObject({
      message: "Add keys",
      status: 402,
      code: "keys_required",
      action: "add_keys",
    });
    expect(isFetchError(error)).toBe(true);
    expect(isFetchError(new Error("nope"))).toBe(false);
  });
});
