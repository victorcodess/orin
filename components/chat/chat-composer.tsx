"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";
import { prefetchDictationToken } from "@/lib/elevenlabs/scribe-token-client";
import {
  useComposerStore,
  type ChatComposerControls,
} from "@/lib/stores/composer-store";

const EASE = [0.25, 0.1, 0.25, 1] as const;

export function ChatComposerDock() {
  const input = useComposerStore((state) => state.input);
  const setInput = useComposerStore((state) => state.setInput);
  const controls = useComposerStore((state) => state.controls);
  const isVisible = useComposerStore((state) => state.isVisible);
  const fadeIn = useComposerStore((state) => state.fadeIn);
  const reduceMotion = useReducedMotion();
  const shouldFade = fadeIn && !reduceMotion;

  useEffect(() => {
    if (isVisible) {
      prefetchDictationToken();
    }
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  const composerControls: ChatComposerControls = controls ?? {
    assistant: DEFAULT_ASSISTANT,
    isSubmitting: true,
    handleSubmit: () => {},
  };

  return (
    <motion.div
      className="relative w-full shrink-0"
      initial={{ opacity: shouldFade ? 0 : 1 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldFade ? 0.35 : 0,
        ease: EASE,
      }}
    >
      <div className="h-[76px] w-full" />
      <div className="to-background from-background/0 absolute inset-x-0 bottom-0 flex items-center justify-center bg-linear-to-b to-15% px-6 pt-8 pb-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-3">
          <ChatInput
            assistant={composerControls.assistant}
            input={input}
            setInput={setInput}
            isSubmitting={composerControls.isSubmitting}
            handleSubmit={composerControls.handleSubmit}
            onStop={composerControls.onStop}
          />
          <p className="text-muted-foreground text-xs font-[450]">
            Orin is an AI assistant and can make mistakes.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
