"use client";

import {
  useConversationControls,
  useConversationInput,
  useConversationMode,
  useConversationStatus,
} from "@elevenlabs/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AgentState } from "@/components/elevenlabs/orb";

export type VoiceActivity =
  | "connecting"
  | "idle"
  | "listening"
  | "talking";

export function resolveVoiceActivity({
  connectionStatus,
  isSpeaking,
  isListening,
  isMuted,
}: {
  connectionStatus: string;
  isSpeaking: boolean;
  isListening: boolean;
  isMuted: boolean;
}): VoiceActivity {
  // Track the real ElevenLabs connection state so the orb reacts immediately,
  // rather than waiting for our own bind round-trip to flip the app status.
  if (connectionStatus === "connected") {
    if (isSpeaking) {
      return "talking";
    }
    if (isMuted) {
      return "idle";
    }
    if (isListening) {
      return "listening";
    }
    return "idle";
  }

  return "connecting";
}

export function voiceActivityToAgentState(activity: VoiceActivity): AgentState {
  switch (activity) {
    case "talking":
      return "talking";
    case "listening":
      return "listening";
    case "connecting":
      return "thinking";
    case "idle":
    default:
      return null;
  }
}

// The orb only consumes live volume in "manual" mode; "auto" drives a synthetic
// animation from agentState. Use real audio while someone is speaking and fall
// back to synthetic motion for connecting/idle.
export function voiceActivityToVolumeMode(
  activity: VoiceActivity
): "auto" | "manual" {
  return activity === "listening" || activity === "talking" ? "manual" : "auto";
}

// The orb represents the agent more than the user, so weight the agent's
// (output) audio heavier than the user's (input). Boost the raw RMS volume the
// same way the ElevenLabs reference UI does so it reacts to normal speech.
const LISTEN_GAIN = 1.5;
const TALK_GAIN = 3;

function scaleVolume(get: (() => number) | undefined, gain: number): number {
  try {
    const raw = get?.() ?? 0;
    return Math.min(1, Math.pow(raw, 0.5) * gain);
  } catch {
    return 0;
  }
}

// The agent's audio starts playing before the server's mode-change event lands,
// so relying on `isSpeaking` alone makes the orb lag the voice. Treat any live
// output above this level as "speaking" and hold it briefly so gaps between
// words don't flicker the orb back to listening.
const TALK_AUDIO_THRESHOLD = 0.01;
const TALK_HOLD_MS = 250;

export function useVoiceOrb() {
  const { status: connectionStatus } = useConversationStatus();
  const { isSpeaking, isListening } = useConversationMode();
  const { isMuted } = useConversationInput();
  const { getInputVolume, getOutputVolume } = useConversationControls();

  // Flip to "talking" the instant the agent's audio is audible, ahead of the
  // (slower) mode-change event.
  const [agentAudible, setAgentAudible] = useState(false);
  useEffect(() => {
    if (connectionStatus !== "connected") {
      setAgentAudible(false);
      return;
    }
    let raf = 0;
    let lastAudibleAt = 0;
    const tick = () => {
      const now = performance.now();
      try {
        if ((getOutputVolume?.() ?? 0) > TALK_AUDIO_THRESHOLD) {
          lastAudibleAt = now;
        }
      } catch {
        // ignore transient getter errors while the session winds down
      }
      const audible = now - lastAudibleAt < TALK_HOLD_MS;
      setAgentAudible((prev) => (prev === audible ? prev : audible));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [connectionStatus, getOutputVolume]);

  const activity = resolveVoiceActivity({
    connectionStatus,
    isSpeaking: isSpeaking || agentAudible,
    isListening,
    isMuted,
  });

  const activityRef = useRef(activity);
  activityRef.current = activity;

  // Feed the *active speaker's* volume into both orb channels (the input channel
  // drives the prominent ring effect), so the orb is just as reactive while the
  // agent talks as while the user speaks — but louder for the agent.
  const getActiveVolume = useCallback(() => {
    const current = activityRef.current;
    if (current === "talking") {
      return scaleVolume(getOutputVolume, TALK_GAIN);
    }
    if (current === "listening") {
      return scaleVolume(getInputVolume, LISTEN_GAIN);
    }
    return 0;
  }, [getInputVolume, getOutputVolume]);

  return {
    activity,
    agentState: voiceActivityToAgentState(activity),
    volumeMode: voiceActivityToVolumeMode(activity),
    getInputVolume: getActiveVolume,
    getOutputVolume: getActiveVolume,
  };
}
