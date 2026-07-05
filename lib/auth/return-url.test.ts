import { describe, expect, it } from "vitest";

import { buildLoginHref, resolveAuthReturnUrl } from "@/lib/auth/return-url";

describe("resolveAuthReturnUrl", () => {
  it("preserves chat URLs including query and hash", () => {
    expect(resolveAuthReturnUrl("/new")).toBe("/new");
    expect(resolveAuthReturnUrl("/c")).toBe("/c");
    expect(resolveAuthReturnUrl("/c/abc")).toBe("/c/abc");
    expect(resolveAuthReturnUrl("/c/abc?draft=1")).toBe("/c/abc?draft=1");
    expect(resolveAuthReturnUrl("/c/abc#section")).toBe("/c/abc#section");
  });

  it("redirects non-chat pages to /new", () => {
    expect(resolveAuthReturnUrl(null)).toBe("/new");
    expect(resolveAuthReturnUrl("/")).toBe("/new");
    expect(resolveAuthReturnUrl("/about")).toBe("/new");
    expect(resolveAuthReturnUrl("/onboarding")).toBe("/new");
    expect(resolveAuthReturnUrl("/auth/login?next=/about")).toBe("/new");
  });
});

describe("buildLoginHref", () => {
  it("omits next when the resolved target is /new", () => {
    expect(buildLoginHref({ returnUrl: "/about" })).toBe("/auth/login");
  });

  it("includes next for chat return URLs", () => {
    expect(buildLoginHref({ returnUrl: "/c/abc" })).toBe(
      "/auth/login?next=%2Fc%2Fabc",
    );
  });
});
