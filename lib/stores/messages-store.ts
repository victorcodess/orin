"use client";

import type { UIMessage } from "ai";
import { create } from "zustand";

import type { AssistantConfig } from "@/lib/orin/defaults";

export type ConversationCache = {
  assistant: AssistantConfig;
  messages: UIMessage[];
};

type MessagesState = {
  cache: Record<string, ConversationCache>;
  inflight: Partial<Record<string, Promise<ConversationCache | null>>>;
  get: (id: string) => ConversationCache | undefined;
  set: (id: string, data: ConversationCache) => void;
  setMessages: (id: string, messages: UIMessage[]) => void;
  remove: (id: string) => void;
  fetch: (id: string) => Promise<ConversationCache | null>;
  prefetch: (id: string) => void;
};

export const useMessagesStore = create<MessagesState>((set, get) => ({
  cache: {},
  inflight: {},

  get: (id) => get().cache[id],

  set: (id, data) =>
    set((state) => ({ cache: { ...state.cache, [id]: data } })),

  setMessages: (id, messages) =>
    set((state) => {
      const entry = state.cache[id];
      if (!entry) {
        return state;
      }

      return {
        cache: { ...state.cache, [id]: { ...entry, messages } },
      };
    }),

  remove: (id) =>
    set((state) => {
      const cache = { ...state.cache };
      const inflight = { ...state.inflight };
      delete cache[id];
      delete inflight[id];
      return { cache, inflight };
    }),

  fetch: (id) => {
    const pending = get().inflight[id];
    if (pending) {
      return pending;
    }

    const promise = fetch(`/api/conversations/${id}`)
      .then(async (response) => {
        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          throw new Error("Failed to load conversation");
        }

        return (await response.json()) as ConversationCache;
      })
      .then((data) => {
        if (data) {
          get().set(id, data);
        }

        set((state) => {
          const inflight = { ...state.inflight };
          delete inflight[id];
          return { inflight };
        });

        return data;
      })
      .catch((error) => {
        set((state) => {
          const inflight = { ...state.inflight };
          delete inflight[id];
          return { inflight };
        });
        throw error;
      });

    set((state) => ({ inflight: { ...state.inflight, [id]: promise } }));
    return promise;
  },

  prefetch: (id) => {
    if (get().cache[id] || get().inflight[id]) {
      return;
    }

    void get().fetch(id);
  },
}));
