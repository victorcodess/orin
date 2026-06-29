"use client";

import { create } from "zustand";

export type VoiceCallMode = "inline" | "fullscreen";
export type VoiceCallStatus =
  | "idle"
  | "connecting"
  | "active"
  | "disconnecting";

/** Hold VAD high briefly so gaps between words don't flip to "quiet". */
export const USER_SPEAKING_HOLD_MS = 450;

type VoiceCallState = {
  status: VoiceCallStatus;
  mode: VoiceCallMode;
  conversationId: string | null;
  pendingToken: string | null;
  error: string | null;
  silenceEndCallTimeout: number | null;
  /** Last finalized transcript or live VAD activity. */
  lastUserSpeechAt: number | null;
  /** When the current post-speech silence period started (mirrors EL turn end). */
  silenceSince: number | null;
  /** Suppress silence countdown while the user is actively speaking. */
  userSpeakingUntil: number | null;
  /** At least one user turn completed — gates post-turn silence countdown. */
  hasUserSpoken: boolean;
  activeSince: number | null;
  agentListening: boolean;
  requestStart: (conversationId: string) => void;
  setPendingToken: (
    pendingToken: string,
    silenceEndCallTimeout?: number | null
  ) => void;
  setActive: () => void;
  setAgentListening: (listening: boolean) => void;
  setDisconnecting: () => void;
  markUserSpeaking: () => void;
  startSilenceClock: () => void;
  clearSilenceClock: () => void;
  reset: () => void;
  setError: (error: string | null) => void;
  toggleMode: () => void;
};

const initialState = {
  status: "idle" as VoiceCallStatus,
  mode: "inline" as VoiceCallMode,
  conversationId: null,
  pendingToken: null,
  error: null,
  silenceEndCallTimeout: null,
  lastUserSpeechAt: null,
  silenceSince: null,
  userSpeakingUntil: null,
  hasUserSpoken: false,
  activeSince: null,
  agentListening: true,
};

function isUserSpeakingNow(state: Pick<VoiceCallState, "userSpeakingUntil">) {
  return (
    state.userSpeakingUntil != null &&
    Date.now() < state.userSpeakingUntil
  );
}

export const useVoiceCallStore = create<VoiceCallState>((set, get) => ({
  ...initialState,
  requestStart: (conversationId) =>
    set({
      status: "connecting",
      mode: "inline",
      conversationId,
      pendingToken: null,
      error: null,
      silenceEndCallTimeout: null,
      lastUserSpeechAt: null,
      silenceSince: null,
      userSpeakingUntil: null,
      hasUserSpoken: false,
      activeSince: null,
      agentListening: true,
    }),
  setPendingToken: (pendingToken, silenceEndCallTimeout = null) =>
    set({
      pendingToken,
      silenceEndCallTimeout,
      lastUserSpeechAt: null,
      silenceSince: null,
      userSpeakingUntil: null,
      hasUserSpoken: false,
      activeSince: null,
    }),
  setActive: () =>
    set({
      status: "active",
      error: null,
      lastUserSpeechAt: null,
      silenceSince: null,
      userSpeakingUntil: null,
      hasUserSpoken: false,
      activeSince: Date.now(),
    }),
  setAgentListening: (listening) => set({ agentListening: listening }),
  setDisconnecting: () => set({ status: "disconnecting" }),
  markUserSpeaking: () => {
    const now = Date.now();
    set({
      hasUserSpoken: true,
      lastUserSpeechAt: now,
      userSpeakingUntil: now + USER_SPEAKING_HOLD_MS,
      silenceSince: null,
    });
  },
  startSilenceClock: () => {
    const state = get();
    if (!state.hasUserSpoken || isUserSpeakingNow(state)) {
      return;
    }
    set({ silenceSince: Date.now() });
  },
  clearSilenceClock: () => set({ silenceSince: null }),
  reset: () => set(initialState),
  setError: (error) => set({ error, status: "idle", pendingToken: null }),
  toggleMode: () =>
    set({
      mode: get().mode === "fullscreen" ? "inline" : "fullscreen",
    }),
}));

export function useIsVoiceCallActive(conversationId: string) {
  return useVoiceCallStore(
    (state) =>
      state.conversationId === conversationId &&
      (state.status === "connecting" ||
        state.status === "active" ||
        state.status === "disconnecting")
  );
}

export function isVoiceUserSpeakingNow() {
  return isUserSpeakingNow(useVoiceCallStore.getState());
}
