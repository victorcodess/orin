"use client";

import { create } from "zustand";

import type { AssistantConfig } from "@/lib/orin/defaults";

export type ChatComposerControls = {
  assistant: AssistantConfig;
  isSubmitting: boolean;
  handleSubmit: (value?: string) => void;
  onStop?: () => void;
};

type ComposerState = {
  input: string;
  controls: ChatComposerControls | null;
  isVisible: boolean;
  fadeIn: boolean;
  setInput: (input: string) => void;
  setControls: (controls: ChatComposerControls | null) => void;
  setIsVisible: (isVisible: boolean, options?: { fadeIn?: boolean }) => void;
};

export const useComposerStore = create<ComposerState>((set) => ({
  input: "",
  controls: null,
  isVisible: false,
  fadeIn: false,
  setInput: (input) => set({ input }),
  setControls: (controls) => set({ controls }),
  setIsVisible: (isVisible, options) =>
    set({
      isVisible,
      fadeIn: isVisible ? (options?.fadeIn ?? false) : false,
    }),
}));

export function getComposerInput() {
  return useComposerStore.getState().input;
}

export function setComposerInput(input: string) {
  useComposerStore.getState().setInput(input);
}
