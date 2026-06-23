"use client";

import type { UIMessage } from "ai";
import { create } from "zustand";

const LIVE_ID_PREFIX = "__orin_voice_live__";
export const EMPTY_VOICE_LIVE_MESSAGES: VoiceLiveMessage[] = [];

export type VoiceLiveMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming: boolean;
};

type VoiceLiveMessagesState = {
  conversationId: string | null;
  messages: VoiceLiveMessage[];
  bindConversation: (conversationId: string) => void;
  setUserTranscript: (text: string) => void;
  applyAgentPart: (part: {
    text: string;
    type: "start" | "delta" | "stop";
  }) => void;
  setAgentTranscript: (text: string) => void;
  reset: () => void;
};

const initialState = {
  conversationId: null,
  messages: EMPTY_VOICE_LIVE_MESSAGES,
};

function createLiveId() {
  return `${LIVE_ID_PREFIX}${crypto.randomUUID()}`;
}

export function isVoiceLiveMessageId(id: string) {
  return id.startsWith(LIVE_ID_PREFIX);
}

export const useVoiceLiveMessagesStore = create<VoiceLiveMessagesState>((set) => ({
  ...initialState,
  bindConversation: (conversationId) =>
    set({
      conversationId,
      messages: [],
    }),
  setUserTranscript: (text) =>
    set((state) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return state;
      }

      const messages = [...state.messages];
      const last = messages.at(-1);

      if (last?.role === "user") {
        messages[messages.length - 1] = { ...last, text: trimmed, streaming: false };
        return { messages };
      }

      messages.push({
        id: createLiveId(),
        role: "user",
        text: trimmed,
        streaming: false,
      });

      return { messages };
    }),
  applyAgentPart: ({ text, type }) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages.at(-1);

      if (type === "start") {
        if (last?.role === "assistant" && last.streaming) {
          return state;
        }

        messages.push({
          id: createLiveId(),
          role: "assistant",
          text: "",
          streaming: true,
        });
        return { messages };
      }

      if (type === "stop") {
        if (last?.role === "assistant") {
          messages[messages.length - 1] = { ...last, streaming: false };
        }
        return { messages };
      }

      if (last?.role === "assistant" && last.streaming) {
        messages[messages.length - 1] = {
          ...last,
          text: last.text + text,
          streaming: true,
        };
        return { messages };
      }

      messages.push({
        id: createLiveId(),
        role: "assistant",
        text,
        streaming: true,
      });

      return { messages };
    }),
  setAgentTranscript: (text) =>
    set((state) => {
      const trimmed = text.trim();
      if (!trimmed) {
        return state;
      }

      const messages = [...state.messages];
      const last = messages.at(-1);

      if (last?.role === "assistant") {
        messages[messages.length - 1] = {
          ...last,
          text: trimmed,
          streaming: false,
        };
        return { messages };
      }

      messages.push({
        id: createLiveId(),
        role: "assistant",
        text: trimmed,
        streaming: false,
      });

      return { messages };
    }),
  reset: () => set(initialState),
}));

export function voiceLiveMessagesToUi(messages: VoiceLiveMessage[]): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    parts: [
      {
        type: "text" as const,
        text: message.text,
        ...(message.streaming ? { state: "streaming" as const } : {}),
      },
    ],
  }));
}
