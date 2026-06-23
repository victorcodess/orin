"use client";

import { create } from "zustand";

import type { AssistantConfig } from "@/lib/orin/defaults";

export type VoiceCallAssistant = Pick<
  AssistantConfig,
  "name" | "voiceId" | "firstMessage"
>;

export type VoiceCallMode = "inline" | "fullscreen";
export type VoiceCallStatus = "idle" | "connecting" | "active" | "disconnecting";

type VoiceCallState = {
  status: VoiceCallStatus;
  mode: VoiceCallMode;
  conversationId: string | null;
  pendingToken: string | null;
  assistant: VoiceCallAssistant | null;
  error: string | null;
  requestStart: (conversationId: string) => void;
  setPendingToken: (pendingToken: string, assistant: VoiceCallAssistant) => void;
  setActive: () => void;
  setDisconnecting: () => void;
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
    }),
  setPendingToken: (pendingToken, assistant) =>
    set({ pendingToken, assistant }),
  setActive: () => set({ status: "active", error: null }),
  setDisconnecting: () => set({ status: "disconnecting" }),
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
        state.status === "disconnecting"),
  );
}
