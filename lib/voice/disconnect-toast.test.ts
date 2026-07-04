import type { DisconnectionDetails } from "@elevenlabs/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getVoiceDisconnectToast } from "@/lib/voice/disconnect-toast";

const baseInput = {
  recentError: false,
  activeSince: null,
  lastUserSpeechAt: null,
  silenceEndCallTimeout: 30,
};

function errorDisconnect(message: string): DisconnectionDetails {
  return { reason: "error", message, context: { type: "error" } };
}

describe("getVoiceDisconnectToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("suppresses toasts after a recent client error", () => {
    expect(
      getVoiceDisconnectToast(
        errorDisconnect("Network failed"),
        { ...baseInput, recentError: true },
      ),
    ).toEqual({ kind: "none" });
  });

  it("suppresses user-initiated disconnects", () => {
    expect(
      getVoiceDisconnectToast({ reason: "user" }, baseInput),
    ).toEqual({ kind: "none" });
  });

  it("maps explicit errors to error toasts", () => {
    expect(
      getVoiceDisconnectToast(errorDisconnect("Upstream unavailable"), baseInput),
    ).toEqual({
      kind: "error",
      title: "Voice call disconnected",
      description: "Upstream unavailable",
    });
  });

  it("detects silence disconnects from agent context", () => {
    expect(
      getVoiceDisconnectToast(
        {
          reason: "agent",
          context: { type: "close", reason: "Ended due to silence" },
        },
        baseInput,
      ),
    ).toEqual({ kind: "silence" });
  });

  it("maps end_call agent context to ended toasts", () => {
    expect(
      getVoiceDisconnectToast(
        {
          reason: "agent",
          context: { type: "end_call", reason: "Conversation finished." },
        },
        baseInput,
      ),
    ).toEqual({
      kind: "ended",
      description: "Conversation finished.",
    });
  });

  it("flags abnormal early websocket closes as errors", () => {
    expect(
      getVoiceDisconnectToast(
        {
          reason: "agent",
          closeCode: 1006,
          closeReason: "Connection dropped",
          context: { type: "close" },
        },
        {
          ...baseInput,
          activeSince: Date.now() - 2_000,
        },
      ),
    ).toEqual({
      kind: "error",
      title: "Voice call disconnected",
      description: "Connection dropped",
    });
  });
});
