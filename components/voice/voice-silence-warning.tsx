"use client";

import { useEffect } from "react";

import { toast } from "@/components/nexus-ui/toaster";
import {
  isVoiceUserSpeakingNow,
  useVoiceCallStore,
} from "@/lib/stores/voice-call-store";

const TOAST_ID = "voice-silence-countdown";
const DEFAULT_SILENCE_END_SEC = 30;
const WARN_LEAD_SEC = 10;
// EL starts its silence clock after the turn ends, not when VAD first fires.
const END_BUFFER_SEC = 5;

function endAfterSec(configured: number | null) {
  const base =
    configured != null && configured > 0 ? configured : DEFAULT_SILENCE_END_SEC;
  return base + END_BUFFER_SEC;
}

/** Countdown toast before ElevenLabs ends the call for user silence. */
export function VoiceSilenceWarning() {
  const active = useVoiceCallStore((s) => s.status === "active");
  const configured = useVoiceCallStore((s) => s.silenceEndCallTimeout);
  const agentListening = useVoiceCallStore((s) => s.agentListening);
  const silenceSince = useVoiceCallStore((s) => s.silenceSince);
  const userSpeakingUntil = useVoiceCallStore((s) => s.userSpeakingUntil);
  const endAfter = endAfterSec(configured);

  useEffect(() => {
    if (!active) {
      toast.dismiss(TOAST_ID);
      return;
    }

    const tick = () => {
      const state = useVoiceCallStore.getState();
      const { agentListening: listening, silenceSince: quietSince } = state;

      if (isVoiceUserSpeakingNow()) {
        toast.dismiss(TOAST_ID);
        return;
      }

      // User just stopped speaking — start the post-turn silence clock.
      if (
        state.hasUserSpoken &&
        state.userSpeakingUntil != null &&
        Date.now() >= state.userSpeakingUntil &&
        quietSince == null &&
        listening
      ) {
        state.startSilenceClock();
      }

      const silenceStart = useVoiceCallStore.getState().silenceSince;

      if (!listening || !silenceStart) {
        toast.dismiss(TOAST_ID);
        return;
      }

      const quietSec = (Date.now() - silenceStart) / 1000;
      const remaining = endAfter - quietSec;

      if (remaining > 0 && remaining <= WARN_LEAD_SEC) {
        toast.warning(`Call ends in ${Math.ceil(remaining)}s`, {
          id: TOAST_ID,
          description: "Say something to stay connected.",
          duration: 60_000,
        });
      } else {
        toast.dismiss(TOAST_ID);
      }
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => {
      window.clearInterval(id);
      toast.dismiss(TOAST_ID);
    };
  }, [active, agentListening, endAfter, silenceSince, userSpeakingUntil]);

  return null;
}
