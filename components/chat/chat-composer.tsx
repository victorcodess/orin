"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { DEFAULT_ASSISTANT, type AssistantConfig } from "@/lib/orin/defaults";

type ChatComposerControls = {
  assistant: AssistantConfig;
  isSubmitting: boolean;
  handleSubmit: (value?: string) => void;
  onStop?: () => void;
};

type ChatComposerContextValue = {
  input: string;
  setInput: (input: string) => void;
  controls: ChatComposerControls | null;
  setControls: Dispatch<SetStateAction<ChatComposerControls | null>>;
  isVisible: boolean;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
};

const ChatComposerContext = createContext<ChatComposerContextValue | null>(null);

export function ChatComposerProvider({ children }: { children: ReactNode }) {
  const [input, setInput] = useState("");
  const [controls, setControls] = useState<ChatComposerControls | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const value = useMemo(
    () => ({
      input,
      setInput,
      controls,
      setControls,
      isVisible,
      setIsVisible,
    }),
    [input, controls, isVisible]
  );

  return (
    <ChatComposerContext.Provider value={value}>
      {children}
    </ChatComposerContext.Provider>
  );
}

export function useChatComposer() {
  const context = useContext(ChatComposerContext);
  if (!context) {
    throw new Error("useChatComposer must be used within ChatComposerProvider");
  }

  return context;
}

export function ChatComposerDock() {
  const { input, setInput, controls, isVisible } = useChatComposer();

  if (!isVisible) {
    return null;
  }

  const composerControls: ChatComposerControls = controls ?? {
    assistant: DEFAULT_ASSISTANT,
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
