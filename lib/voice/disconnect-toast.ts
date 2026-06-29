import type { DisconnectionDetails } from "@elevenlabs/client";

export type VoiceDisconnectToast =
  | { kind: "none" }
  | { kind: "silence" }
  | { kind: "ended"; description?: string }
  | { kind: "error"; title: string; description?: string };

type DisconnectToastInput = {
  recentError: boolean;
  activeSince: number | null;
  lastUserSpeechAt: number | null;
  silenceEndCallTimeout: number | null;
};

const SILENCE_KEYWORDS = ["silence", "inactivity", "no input", "no_input"];

function contextText(details: Extract<DisconnectionDetails, { reason: "agent" }>) {
  return [details.context?.reason, details.closeReason]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isSilenceContext(text: string) {
  return SILENCE_KEYWORDS.some((keyword) => text.includes(keyword));
}

/** Map ElevenLabs disconnect details to a user-facing toast (or none). */
export function getVoiceDisconnectToast(
  details: DisconnectionDetails,
  input: DisconnectToastInput,
): VoiceDisconnectToast {
  if (input.recentError) {
    return { kind: "none" };
  }

  if (details.reason === "user") {
    return { kind: "none" };
  }

  if (details.reason === "error") {
    return {
      kind: "error",
      title: "Voice call disconnected",
      description: details.message,
    };
  }

  const text = contextText(details);

  if (isSilenceContext(text)) {
    return { kind: "silence" };
  }

  if (details.context?.type === "end_call") {
    return {
      kind: "ended",
      description: details.context.reason ?? "The call ended.",
    };
  }

  const activeMs = input.activeSince ? Date.now() - input.activeSince : 0;
  const abnormalClose =
    details.closeCode === 1006 ||
    details.closeCode === 1011 ||
    (activeMs > 0 && activeMs < 10_000 && details.context?.type === "close");

  if (abnormalClose) {
    return {
      kind: "error",
      title: "Voice call disconnected",
      description:
        details.closeReason?.trim() ||
        details.context?.reason?.trim() ||
        "The connection was lost unexpectedly.",
    };
  }

  const quietSec = input.lastUserSpeechAt
    ? (Date.now() - input.lastUserSpeechAt) / 1000
    : activeMs / 1000;
  const silenceThreshold = Math.max(5, (input.silenceEndCallTimeout ?? 30) - 5);

  if (
    (details.closeCode === 1000 || details.context?.type === "close") &&
    quietSec >= silenceThreshold
  ) {
    return { kind: "silence" };
  }

  if (details.reason === "agent") {
    return {
      kind: "ended",
      description: details.closeReason?.trim() || "The call ended.",
    };
  }

  return { kind: "none" };
}
