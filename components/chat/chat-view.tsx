"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { useChatComposer } from "@/components/chat/chat-composer";
import {
  ChatMessageList,
  PENDING_ASSISTANT_ID,
} from "@/components/chat/message-list";
import {
  CONVERSATIONS_CHANGED_EVENT,
} from "@/lib/conversations-cache";
import { toast } from "@/components/nexus-ui/toaster";
import {
  Thread,
  ThreadContent,
  ThreadScrollToBottom,
} from "@/components/nexus-ui/thread";
import { isKeyboardShortcutsDialogOpen } from "@/components/shell/app-keyboard-shortcuts";
import { chatFetch } from "@/lib/ai/chat-fetch";
import type { AssistantConfig } from "@/lib/orin/defaults";
import { cn } from "@/lib/utils";

function focusComposerInput() {
  requestAnimationFrame(() => {
    const input = document.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Message input"]'
    );

    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  });
}

function toastChatError(error: Error) {
  const message = error.message;

  if (message.includes("OPENAI_API_KEY")) {
    toast.error("OpenAI API key not configured", {
      description:
        "Add OPENAI_API_KEY to .env.local and restart the dev server.",
      duration: 8000,
    });
    return;
  }

  if (message === "Forbidden") {
    toast.error("Session expired", {
      description: "Start a new chat from the home page.",
      action: {
        label: "New chat",
        onClick: () => {
          window.location.href = "/new";
        },
      },
      duration: 8000,
    });
    return;
  }

  if (message === "Conversation not found") {
    toast.error("Conversation not found", {
      description: "This chat may have been deleted.",
      action: {
        label: "New chat",
        onClick: () => {
          window.location.href = "/new";
        },
      },
    });
    return;
  }

  toast.error("Couldn't reach Orin", {
    description: message,
    duration: 6000,
  });
}

type ChatViewProps = {
  conversationId: string;
  assistant: AssistantConfig;
  initialMessages: UIMessage[];
  initialPrompt?: string;
};

export function ChatView({
  conversationId,
  assistant,
  initialMessages,
  initialPrompt,
}: ChatViewProps) {
  const router = useRouter();
  const { getInput, setInput, setControls, setIsVisible } = useChatComposer();
  const sentInitialPrompt = useRef(false);
  const [activeReadAloudMessageId, setActiveReadAloudMessageId] = useState<
    string | null
  >(null);
  const [isReadAloudPaused, setIsReadAloudPaused] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
    setInput("");
  }, [setInput]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId },
        fetch: chatFetch,
      }),
    [conversationId]
  );

  const { messages, sendMessage, regenerate, status, stop, error, clearError } =
    useChat({
      transport,
      messages: initialMessages,
      generateId: () => crypto.randomUUID(),
      onError: (chatError) => {
        console.error("[orin:chat-view] useChat error", chatError);
        toastChatError(chatError);
        clearError();
      },
      onFinish: () => {
        console.log("[orin:chat-view] stream finished", {
          conversationId,
          messageCount: messages.length,
        });
        window.dispatchEvent(new CustomEvent(CONVERSATIONS_CHANGED_EVENT));
      },
    });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isKeyboardShortcutsDialogOpen()) {
        return;
      }

      event.preventDefault();
      stop();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, stop]);

  useEffect(() => {
    if (!editingMessageId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isKeyboardShortcutsDialogOpen()) {
        return;
      }

      event.preventDefault();
      cancelEditing();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cancelEditing, editingMessageId]);

  useEffect(() => {
    const prompt = initialPrompt?.trim();
    if (!prompt || sentInitialPrompt.current) {
      return;
    }

    sentInitialPrompt.current = true;
    sendMessage({ text: prompt });
    router.replace(`/c/${conversationId}`, { scroll: false });
  }, [conversationId, initialPrompt, router, sendMessage]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    console.log("[orin:chat-view] status", {
      conversationId,
      status,
      messageCount: messages.length,
      hasError: Boolean(error),
    });
  }, [conversationId, status, messages.length, error]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleSubmit = useCallback(
    (value?: string) => {
      const trimmed = (value ?? getInput()).trim();
      if (!trimmed || isLoading) {
        return;
      }

      console.log("[orin:chat-view] sending message", {
        conversationId,
        preview: trimmed.slice(0, 80),
        editingMessageId,
      });
      sendMessage(
        editingMessageId
          ? { text: trimmed, messageId: editingMessageId }
          : { text: trimmed }
      );
      setInput("");
      setEditingMessageId(null);
    },
    [conversationId, editingMessageId, getInput, isLoading, sendMessage, setInput]
  );

  const handleRetryMessage = useCallback(
    (messageId: string) => {
      void regenerate({ messageId });
    },
    [regenerate]
  );

  const handleEditMessage = useCallback(
    (messageId: string, text: string) => {
      setEditingMessageId(messageId);
      setInput(text);
      focusComposerInput();
    },
    [setInput]
  );

  const readAloud = useMemo(
    () => ({
      activeMessageId: activeReadAloudMessageId,
      isPaused: isReadAloudPaused,
      setActiveMessageId: setActiveReadAloudMessageId,
      setIsPaused: setIsReadAloudPaused,
    }),
    [activeReadAloudMessageId, isReadAloudPaused]
  );

  useLayoutEffect(() => {
    setIsVisible(true);
    setControls({
      assistant,
      isSubmitting: isLoading,
      handleSubmit,
      onStop: stop,
    });
  }, [assistant, handleSubmit, isLoading, setControls, setIsVisible, stop]);

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages]
  );
  const lastMessage = visibleMessages.at(-1);
  const showPendingAssistant = isLoading && lastMessage?.role === "user";
  const displayMessages = showPendingAssistant
    ? [
        ...visibleMessages,
        {
          id: PENDING_ASSISTANT_ID,
          role: "assistant" as const,
          parts: [],
        },
      ]
    : visibleMessages;

  const [hasMounted, setHasMounted] = useState(false);

  useLayoutEffect(() => {
    setTimeout(() => {
      setHasMounted(true);
    }, 200);
  }, []);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
      <Thread
        className={cn(
          "h-(--orin-thread-height) min-h-0 transition-opacity duration-300 [--orin-thread-height:calc(100dvh-133px)] md:[--orin-thread-height:calc(100dvh-156px)]",
          !hasMounted && "opacity-0"
        )}
        initial={"instant"}
        style={
          {
            "--orin-thread-content-gap": "24px",
            "--orin-thread-content-bottom-padding": "240px",
            "--orin-min-height-misc": "24px",
          } as CSSProperties
        }
      >
        <ThreadContent className="mx-auto w-full max-w-3xl items-stretch gap-(--orin-thread-content-gap) pt-7.5 pb-30 md:pt-10 md:pb-(--orin-thread-content-bottom-padding)">
          {visibleMessages.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-24 text-center">
              <p className="text-foreground text-lg font-medium">
                {assistant.name}
              </p>
              <p className="max-w-md text-sm">{assistant.firstMessage}</p>
            </div>
          ) : (
            <ChatMessageList
              messages={displayMessages}
              isLoading={isLoading}
              editingMessageId={editingMessageId}
              readAloud={readAloud}
              onRetry={handleRetryMessage}
              onEdit={handleEditMessage}
              onCancelEdit={cancelEditing}
            />
          )}
        </ThreadContent>
        <ThreadScrollToBottom className="bottom-9 shadow-2xl md:bottom-18" />
      </Thread>
    </div>
  );
}
