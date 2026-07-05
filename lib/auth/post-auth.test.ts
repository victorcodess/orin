import { describe, expect, it } from "vitest";

import { postAuthRedirectPath } from "@/lib/auth/post-auth";

describe("postAuthRedirectPath", () => {
  it("sends new signups to onboarding before next", () => {
    expect(
      postAuthRedirectPath({
        onboardingCompleted: false,
        isSignup: true,
        next: "/c/abc",
      }),
    ).toBe("/onboarding");
  });

  it("delegates returning users to resolveAuthReturnUrl", () => {
    expect(
      postAuthRedirectPath({
        onboardingCompleted: true,
        isSignup: false,
        next: "/c/abc",
      }),
    ).toBe("/c/abc");

    expect(
      postAuthRedirectPath({
        onboardingCompleted: true,
        isSignup: false,
        next: "/about",
      }),
    ).toBe("/new");
  });
});
