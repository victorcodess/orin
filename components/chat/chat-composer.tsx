"use client";

import { useEffect } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { useAssistantConfig } from "@/lib/stores/assistant-config-store";
import { prefetchDictationToken } from "@/lib/elevenlabs/scribe-token-client";
import {
  useComposerStore,
  type ChatComposerControls,
} from "@/lib/stores/composer-store";

export function ChatComposerDock() {
  const input = useComposerStore((state) => state.input);
  const setInput = useComposerStore((state) => state.setInput);
  const controls = useComposerStore((state) => state.controls);
  const assistantConfig = useAssistantConfig();

  useEffect(() => {
    prefetchDictationToken();
  }, []);

  const composerControls: ChatComposerControls = controls ?? {
    assistant: assistantConfig,
    isSubmitting: true,
    handleSubmit: () => {},
  };

  return (
    <>
      <div className="h-[76px] w-full shrink-0" />
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
    </>
  );
}
