import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  QUOTA_LIMITS,
  VOICE_MAX_MINUTES_PER_CALL,
  billVoiceMinutes,
  isUnderQuota,
  quotaLimit,
  quotaTier,
} from "@/lib/quotas/limits";
import type { QuotaContext } from "@/lib/quotas/types";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

function chain(resolved: { data?: unknown; count?: number | null; error?: null }) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };

  return {
    ...builder,
    then(onFulfilled: (value: unknown) => unknown) {
      return Promise.resolve(resolved).then(onFulfilled);
    },
  };
}

describe("quotaTier", () => {
  it("returns authed when userId is present", () => {
    expect(quotaTier({ userId: "user-1", sessionId: null })).toBe("authed");
  });

  it("returns anon for session-only context", () => {
    expect(quotaTier({ userId: null, sessionId: "sess-1" })).toBe("anon");
  });
});

describe("quotaLimit", () => {
  it("uses tier-specific limits", () => {
    const anon: QuotaContext = { userId: null, sessionId: "sess-1" };
    const authed: QuotaContext = { userId: "user-1", sessionId: null };

    expect(quotaLimit(anon, "message_turn")).toBe(
      QUOTA_LIMITS.anon.message_turn,
    );
    expect(quotaLimit(authed, "voice_session")).toBe(
      QUOTA_LIMITS.authed.voice_session,
    );
  });
});

describe("billVoiceMinutes", () => {
  it("returns zero for sub-second calls", () => {
    expect(billVoiceMinutes(0)).toBe(0);
    expect(billVoiceMinutes(0.5)).toBe(0);
  });

  it("ceilings partial minutes and caps per call", () => {
    expect(billVoiceMinutes(61)).toBe(2);
    expect(billVoiceMinutes(VOICE_MAX_MINUTES_PER_CALL * 60 + 120)).toBe(
      VOICE_MAX_MINUTES_PER_CALL,
    );
  });
});

describe("isUnderQuota", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("always allows admins", async () => {
    await expect(
      isUnderQuota(
        { userId: "user-1", sessionId: null, isAdmin: true },
        "message_turn",
      ),
    ).resolves.toBe(true);

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("checks voice minutes against the voice allowance", async () => {
    mockFrom.mockReturnValue(
      chain({
        data: [{ amount: QUOTA_LIMITS.authed.voice_session - 1 }],
      }),
    );

    await expect(
      isUnderQuota({ userId: "user-1", sessionId: null }, "voice_session"),
    ).resolves.toBe(true);

    mockFrom.mockReturnValue(
      chain({
        data: [{ amount: QUOTA_LIMITS.authed.voice_session }],
      }),
    );

    await expect(
      isUnderQuota({ userId: "user-1", sessionId: null }, "voice_session"),
    ).resolves.toBe(false);
  });

  it("compares counted usage to limits for text operations", async () => {
    mockFrom.mockReturnValue(
      chain({
        count: QUOTA_LIMITS.anon.message_turn - 1,
      }),
    );

    await expect(
      isUnderQuota({ userId: null, sessionId: "sess-1" }, "message_turn"),
    ).resolves.toBe(true);

    mockFrom.mockReturnValue(
      chain({
        count: QUOTA_LIMITS.anon.message_turn,
      }),
    );

    await expect(
      isUnderQuota({ userId: null, sessionId: "sess-1" }, "message_turn"),
    ).resolves.toBe(false);
  });
});
