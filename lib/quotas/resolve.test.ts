import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuotaBlockedError } from "@/lib/quotas/errors";
import {
  assertQuotaAllowed,
  resolveElevenLabsKey,
  resolveOpenAIKey,
} from "@/lib/quotas/resolve";
import type { QuotaContext } from "@/lib/quotas/types";

const isUnderQuota = vi.fn();
const getStoredUserKeys = vi.fn();

vi.mock("@/lib/quotas/limits", () => ({
  isUnderQuota: (...args: unknown[]) => isUnderQuota(...args),
}));

vi.mock("@/lib/quotas/keys", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/quotas/keys")>();

  return {
    ...actual,
    getStoredUserKeys: (...args: unknown[]) => getStoredUserKeys(...args),
    getPlatformOpenAIKey: () => "platform-openai-key",
    getPlatformElevenLabsKey: () => "platform-elevenlabs-key",
  };
});

const anon: QuotaContext = { userId: null, sessionId: "sess-1" };
const authed: QuotaContext = { userId: "user-1", sessionId: null };

beforeEach(() => {
  isUnderQuota.mockReset();
  getStoredUserKeys.mockReset();
});

describe("assertQuotaAllowed", () => {
  it("blocks anonymous voice and read-aloud", async () => {
    await expect(
      assertQuotaAllowed(anon, "voice_session"),
    ).rejects.toMatchObject({
      code: "feature_requires_auth",
      action: "signup",
    });

    await expect(assertQuotaAllowed(anon, "read_aloud")).rejects.toMatchObject({
      code: "feature_requires_auth",
      action: "signup",
    });
  });

  it("allows operations under platform quota", async () => {
    isUnderQuota.mockResolvedValue(true);

    await expect(assertQuotaAllowed(authed, "message_turn")).resolves.toBeUndefined();
  });

  it("requires signup when anon exceeds quota", async () => {
    isUnderQuota.mockResolvedValue(false);

    await expect(assertQuotaAllowed(anon, "message_turn")).rejects.toMatchObject({
      code: "signup_required",
      action: "signup",
    });
  });

  it("requires BYOK when authed user exceeds quota without keys", async () => {
    isUnderQuota.mockResolvedValue(false);
    getStoredUserKeys.mockResolvedValue({
      openaiKey: null,
      elevenlabsKey: null,
    });

    await expect(assertQuotaAllowed(authed, "message_turn")).rejects.toMatchObject({
      code: "keys_required",
      action: "add_keys",
    });
  });

  it("allows authed over-quota users with the required keys", async () => {
    isUnderQuota.mockResolvedValue(false);
    getStoredUserKeys.mockResolvedValue({
      openaiKey: "sk-user",
      elevenlabsKey: null,
    });

    await expect(assertQuotaAllowed(authed, "message_turn")).resolves.toBeUndefined();
  });
});

describe("resolveOpenAIKey", () => {
  it("returns platform key while under quota", async () => {
    isUnderQuota.mockResolvedValue(true);

    await expect(resolveOpenAIKey(authed, "message_turn")).resolves.toEqual({
      key: "platform-openai-key",
      source: "platform",
    });
  });

  it("returns user key after quota is exhausted", async () => {
    isUnderQuota.mockResolvedValue(false);
    getStoredUserKeys.mockResolvedValue({
      openaiKey: "sk-user",
      elevenlabsKey: null,
    });

    await expect(resolveOpenAIKey(authed, "message_turn")).resolves.toEqual({
      key: "sk-user",
      source: "user",
    });
  });

  it("throws when over quota without a user key", async () => {
    isUnderQuota.mockResolvedValue(false);
    getStoredUserKeys.mockResolvedValue({
      openaiKey: null,
      elevenlabsKey: null,
    });

    await expect(resolveOpenAIKey(authed, "message_turn")).rejects.toBeInstanceOf(
      QuotaBlockedError,
    );
  });
});

describe("resolveElevenLabsKey", () => {
  it("returns platform key while under quota", async () => {
    isUnderQuota.mockResolvedValue(true);

    await expect(resolveElevenLabsKey(authed, "read_aloud")).resolves.toEqual({
      key: "platform-elevenlabs-key",
      source: "platform",
    });
  });

  it("returns user key after quota is exhausted", async () => {
    isUnderQuota.mockResolvedValue(false);
    getStoredUserKeys.mockResolvedValue({
      openaiKey: null,
      elevenlabsKey: "el-user",
    });

    await expect(resolveElevenLabsKey(authed, "read_aloud")).resolves.toEqual({
      key: "el-user",
      source: "user",
    });
  });
});
