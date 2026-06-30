"use client";

import { create } from "zustand";

import {
  broadcastConversationDelete,
  deleteConversationById,
} from "@/lib/conversation-title";

export type VoiceCallMode = "inline" | "fullscreen";
export type VoiceCallStatus =
  | "idle"
  | "connecting"
  | "active"
  | "disconnecting";

export type VoiceCallOrigin = "new-chat" | "conversation";

/** Hold VAD high briefly so gaps between words don't flip to "quiet". */
export const USER_SPEAKING_HOLD_MS = 450;

type VoiceCallState = {
  status: VoiceCallStatus;
  mode: VoiceCallMode;
  origin: VoiceCallOrigin | null;
  conversationId: string | null;
  pendingToken: string | null;
  error: string | null;
  silenceEndCallTimeout: number | null;
  lastUserSpeechAt: number | null;
  silenceSince: number | null;
  userSpeakingUntil: number | null;
  hasUserSpoken: boolean;
  activeSince: number | null;
  agentListening: boolean;
  newChatCommitted: boolean;
  requestStart: (conversationId: string) => void;
  requestStartNewChat: () => void;
  commitNewChatCall: () => void;
  setPendingToken: (
    pendingToken: string,
    silenceEndCallTimeout?: number | null,
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
  origin: null as VoiceCallOrigin | null,
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
  newChatCommitted: false,
};

function isUserSpeakingNow(state: Pick<VoiceCallState, "userSpeakingUntil">) {
  return (
    state.userSpeakingUntil != null &&
    Date.now() < state.userSpeakingUntil
  );
}

function shouldAbandonNewChatDraft(state: VoiceCallState) {
  return (
    state.origin === "new-chat" &&
    !state.newChatCommitted &&
    state.conversationId != null
  );
}

function abandonNewChatDraft(conversationId: string) {
  broadcastConversationDelete(conversationId);
  void deleteConversationById(conversationId).catch(() => {});
}

function startConnecting(origin: VoiceCallOrigin, conversationId: string) {
  return {
    status: "connecting" as const,
    mode: "inline" as const,
    origin,
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
    newChatCommitted: false,
  };
}

function clearCallState(state: VoiceCallState) {
  if (shouldAbandonNewChatDraft(state) && state.conversationId) {
    abandonNewChatDraft(state.conversationId);
  }
}

export const useVoiceCallStore = create<VoiceCallState>((set, get) => ({
  ...initialState,
  requestStart: (conversationId) =>
    set(startConnecting("conversation", conversationId)),
  requestStartNewChat: () =>
    set(startConnecting("new-chat", crypto.randomUUID())),
  commitNewChatCall: () => set({ newChatCommitted: true }),
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
  reset: () => {
    clearCallState(get());
    set(initialState);
  },
  setError: (error) => {
    clearCallState(get());
    set({ ...initialState, error });
  },
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

export function isVoiceUserSpeakingNow() {
  return isUserSpeakingNow(useVoiceCallStore.getState());
}
