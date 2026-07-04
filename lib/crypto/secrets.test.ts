import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret, maskSecret } from "@/lib/crypto/secrets";

describe("encryptSecret / decryptSecret", () => {
  it("round-trips plaintext", () => {
    const plaintext = "sk-proj-test-key-1234567890abcdef";
    const encrypted = encryptSecret(plaintext);

    expect(encrypted).not.toContain(plaintext);
    expect(decryptSecret(encrypted)).toBe(plaintext);
  });

  it("produces distinct ciphertext for the same plaintext", () => {
    const plaintext = "sk-same-key";
    const a = encryptSecret(plaintext);
    const b = encryptSecret(plaintext);

    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(plaintext);
    expect(decryptSecret(b)).toBe(plaintext);
  });

  it("rejects malformed payloads", () => {
    expect(() => decryptSecret("not-valid")).toThrow(
      "Invalid encrypted secret payload",
    );
  });
});

describe("maskSecret", () => {
  it("never exposes the full secret for long keys", () => {
    const secret = "sk-proj-abcdefghijklmnopqrstuvwxyz";
    const masked = maskSecret(secret);

    expect(masked).not.toBe(secret);
    expect(masked).not.toContain(secret.slice(4, -4));
    expect(masked).toMatch(/^sk-/);
    expect(masked).toMatch(/wxyz$/);
  });

  it("masks short secrets entirely", () => {
    expect(maskSecret("short")).toBe("••••••••");
    expect(maskSecret("12345678")).toBe("••••••••");
  });

  it("trims whitespace before masking", () => {
    expect(maskSecret("  sk-long-key-value-here  ")).toMatch(/^sk-/);
  });
});
