"use client";

import { create } from "zustand";

export type MessageBubbleLayout = "single-bubble" | "both-bubbles";

const STORAGE_KEY = "orin:message-bubble-layout";

type MessageStyleState = {
  layout: MessageBubbleLayout;
  toggleLayout: () => void;
};

export const useMessageStyleStore = create<MessageStyleState>((set) => ({
  layout: "single-bubble",
  toggleLayout: () =>
    set((state) => {
      const layout =
        state.layout === "single-bubble" ? "both-bubbles" : "single-bubble";
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, layout);
      }
      return { layout };
    }),
}));

export function initMessageStyleStore() {
  if (typeof window === "undefined") {
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "single-bubble" || stored === "both-bubbles") {
    useMessageStyleStore.setState({ layout: stored });
  }
}
