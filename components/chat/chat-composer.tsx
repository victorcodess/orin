"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { DEFAULT_ASSISTANT, type AssistantConfig } from "@/lib/orin/defaults";
import { prefetchScribeToken } from "@/lib/elevenlabs/scribe-token-client";

type ChatComposerControls = {
  assistant: AssistantConfig;
  isSubmitting: boolean;
  handleSubmit: (value?: string) => void;
  onStop?: () => void;
};

type ComposerInput = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => string;
  setInput: (input: string) => void;
  getInput: () => string;
};

function createComposerInput(): ComposerInput {
  let value = "";
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return value;
    },
    getInput() {
      return value;
    },
    setInput(input) {
      if (value !== input) {
        value = input;
        listeners.forEach((listener) => listener());
      }
    },
  };
}

type ChatComposerContextValue = {
  composerInput: ComposerInput;
  setInput: (input: string) => void;
  getInput: () => string;
  controls: ChatComposerControls | null;
  setControls: Dispatch<SetStateAction<ChatComposerControls | null>>;
  isVisible: boolean;
  setIsVisible: Dispatch<SetStateAction<boolean>>;
};

const ChatComposerContext = createContext<ChatComposerContextValue | null>(null);

export function ChatComposerProvider({ children }: { children: ReactNode }) {
  const composerInputRef = useRef<ComposerInput | null>(null);
  if (!composerInputRef.current) {
    composerInputRef.current = createComposerInput();
  }
  const composerInput = composerInputRef.current;

  const [controls, setControls] = useState<ChatComposerControls | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const value = useMemo(
    () => ({
      composerInput,
      setInput: composerInput.setInput,
      getInput: composerInput.getInput,
      controls,
      setControls,
      isVisible,
      setIsVisible,
    }),
    [composerInput, controls, isVisible]
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

export function useComposerInput() {
  const { composerInput } = useChatComposer();

  return useSyncExternalStore(
    composerInput.subscribe,
    composerInput.getSnapshot,
    composerInput.getSnapshot
  );
}

export function ChatComposerDock() {
  const { setInput, controls, isVisible } = useChatComposer();
  const input = useComposerInput();

  useEffect(() => {
    if (isVisible) {
      prefetchScribeToken();
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
