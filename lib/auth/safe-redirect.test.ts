import { describe, expect, it } from "vitest";

import { safeRedirectUrl } from "@/lib/auth/safe-redirect";

describe("safeRedirectUrl", () => {
  it("returns fallback for empty values", () => {
    expect(safeRedirectUrl(null)).toBe("/new");
    expect(safeRedirectUrl(undefined)).toBe("/new");
    expect(safeRedirectUrl("")).toBe("/new");
  });

  it("allows same-origin relative paths", () => {
    expect(safeRedirectUrl("/c/abc")).toBe("/c/abc");
    expect(safeRedirectUrl("/settings?tab=keys")).toBe("/settings?tab=keys");
  });

  it("blocks open redirects", () => {
    expect(safeRedirectUrl("//evil.com")).toBe("/new");
    expect(safeRedirectUrl("https://evil.com")).toBe("/new");
    expect(safeRedirectUrl("/\\evil.com")).toBe("/new");
    expect(safeRedirectUrl("/path\0hidden")).toBe("/new");
  });

  it("uses custom fallback", () => {
    expect(safeRedirectUrl(null, "/onboarding")).toBe("/onboarding");
    expect(safeRedirectUrl("//evil.com", "/onboarding")).toBe("/onboarding");
  });
});
