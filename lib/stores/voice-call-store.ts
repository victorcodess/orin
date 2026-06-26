"use client";

import { create } from "zustand";

import type { AssistantConfig } from "@/lib/orin/defaults";

export type VoiceCallAssistant = Pick<
  AssistantConfig,
  "name" | "voiceId" | "firstMessage"
>;

export type VoiceCallMode = "inline" | "fullscreen";
export type VoiceCallStatus =
  | "idle"
  | "connecting"
  | "active"
  | "disconnecting";

type VoiceCallState = {
  status: VoiceCallStatus;
  mode: VoiceCallMode;
  conversationId: string | null;
  pendingToken: string | null;
  assistant: VoiceCallAssistant | null;
  error: string | null;
  silenceEndCallTimeout: number | null;
  lastUserSpeechAt: number | null;
  agentListening: boolean;
  requestStart: (conversationId: string) => void;
  setPendingToken: (
    pendingToken: string,
    assistant: VoiceCallAssistant,
    silenceEndCallTimeout?: number | null
  ) => void;
  setActive: () => void;
  setAgentListening: (listening: boolean) => void;
  setDisconnecting: () => void;
  touchUserSpeech: () => void;
  reset: () => void;
  setError: (error: string | null) => void;
  toggleMode: () => void;
};

const initialState = {
  status: "idle" as VoiceCallStatus,
  mode: "inline" as VoiceCallMode,
  conversationId: null,
  pendingToken: null,
  assistant: null,
  error: null,
  silenceEndCallTimeout: null,
  lastUserSpeechAt: null,
  agentListening: true,
};

export const useVoiceCallStore = create<VoiceCallState>((set, get) => ({
  ...initialState,
  requestStart: (conversationId) =>
    set({
      status: "connecting",
      mode: "inline",
      conversationId,
      pendingToken: null,
      assistant: null,
      error: null,
      silenceEndCallTimeout: null,
      lastUserSpeechAt: null,
      agentListening: true,
    }),
  setPendingToken: (pendingToken, assistant, silenceEndCallTimeout = null) =>
    set({
      pendingToken,
      assistant,
      silenceEndCallTimeout,
      lastUserSpeechAt: null,
    }),
  setActive: () =>
    set({ status: "active", error: null, lastUserSpeechAt: Date.now() }),
  setAgentListening: (listening) => set({ agentListening: listening }),
  setDisconnecting: () => set({ status: "disconnecting" }),
  touchUserSpeech: () => set({ lastUserSpeechAt: Date.now() }),
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
