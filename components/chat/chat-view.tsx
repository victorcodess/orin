"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
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
  Message,
  MessageContent,
  MessageMarkdown,
  MessageStack,
} from "@/components/nexus-ui/message";
import { toast } from "@/components/nexus-ui/toaster";
import {
  Thread,
  ThreadContent,
  ThreadScrollToBottom,
} from "@/components/nexus-ui/thread";
import { TextShimmer } from "@/components/nexus-ui/text-shimmer";
import { isKeyboardShortcutsDialogOpen } from "@/components/shell/app-keyboard-shortcuts";
import { chatFetch } from "@/lib/ai/chat-fetch";
import type { AssistantConfig } from "@/lib/orin/defaults";
import { cn } from "@/lib/utils";

function textFromMessage(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

const PENDING_ASSISTANT_ID = "__orin-pending-assistant__";

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
          window.location.href = "/chat";
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
          window.location.href = "/chat";
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
  const { input, setInput, setControls, setIsVisible } = useChatComposer();
  const sentInitialPrompt = useRef(false);
  const previousUserMessageRef = useRef<HTMLDivElement | null>(null);
  const [previousUserMessageHeight, setPreviousUserMessageHeight] = useState(0);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId },
        fetch: chatFetch,
      }),
    [conversationId]
  );

  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    transport,
    messages: initialMessages,
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
      window.dispatchEvent(new CustomEvent("orin:conversations-changed"));
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
    const prompt = initialPrompt?.trim();
    if (!prompt || sentInitialPrompt.current) {
      return;
    }

    sentInitialPrompt.current = true;
    sendMessage({ text: prompt });
    router.replace(`/chat/${conversationId}`, { scroll: false });
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

  const handleSubmit = useCallback(
    (value?: string) => {
      const trimmed = (value ?? input).trim();
      if (!trimmed || isLoading) {
        return;
      }

      console.log("[orin:chat-view] sending message", {
        conversationId,
        preview: trimmed.slice(0, 80),
      });
      sendMessage({ text: trimmed });
      setInput("");
    },
    [conversationId, input, isLoading, sendMessage, setInput]
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
  const lastIndex = displayMessages.length - 1;
  const lastMessageIsAssistant =
    displayMessages[lastIndex]?.role === "assistant";
  const previousUserMessageIndex = lastMessageIsAssistant
    ? displayMessages.findLastIndex(
        (message, index) => index < lastIndex && message.role === "user"
      )
    : -1;
  const useAssistantMinHeight =
    lastMessageIsAssistant &&
    previousUserMessageIndex > -1 &&
    displayMessages.some(
      (message, index) => index < lastIndex && message.role === "assistant"
    );

  const attachPreviousUserMessageRef = useCallback(
    (node: HTMLDivElement | null) => {
      previousUserMessageRef.current = node;
      setPreviousUserMessageHeight(node?.clientHeight ?? 0);
    },
    []
  );

  useLayoutEffect(() => {
    if (previousUserMessageIndex < 0) {
      setPreviousUserMessageHeight(0);
      return;
    }

    const element = previousUserMessageRef.current;
    if (!element) {
      return;
    }

    const measureHeight = () => {
      setPreviousUserMessageHeight(element.clientHeight);
    };

    measureHeight();
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, [previousUserMessageIndex]);

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
            "--orin-thread-content-bottom-padding": "120px",
            "--orin-min-height-misc": "24px",
          } as CSSProperties
        }
      >
        <ThreadContent className="mx-auto w-full max-w-3xl items-stretch gap-(--orin-thread-content-gap) pb-(--orin-thread-content-bottom-padding)">
          {visibleMessages.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-24 text-center">
              <p className="text-foreground text-lg font-medium">
                {assistant.name}
              </p>
              <p className="max-w-md text-sm">{assistant.firstMessage}</p>
            </div>
          ) : (
            <>
              {displayMessages.map((message, index) => {
                const isLast = index === lastIndex;
                const isAssistant = message.role === "assistant";
                const text = textFromMessage(message);
                const showTyping =
                  isAssistant && isLast && isLoading && !text.trim();

                return (
                  <Message
                    key={
                      isAssistant && displayMessages[index - 1]?.role === "user"
                        ? `${displayMessages[index - 1].id}::assistant`
                        : message.id
                    }
                    ref={
                      index === previousUserMessageIndex
                        ? attachPreviousUserMessageRef
                        : undefined
                    }
                    from={message.role === "user" ? "user" : "assistant"}
                    className={
                      isLast && useAssistantMinHeight
                        ? "min-h-[calc(var(--orin-thread-height)-var(--orin-prev-user-height)-var(--orin-thread-content-gap)-var(--orin-thread-content-bottom-padding)-var(--orin-min-height-misc))]"
                        : undefined
                    }
                    style={
                      isLast && useAssistantMinHeight
                        ? ({
                            "--orin-prev-user-height": `${previousUserMessageHeight}px`,
                          } as CSSProperties)
                        : undefined
                    }
                    aria-label={showTyping ? "Assistant is typing" : undefined}
                  >
                    <MessageStack>
                      <MessageContent>
                        {showTyping ? (
                          <TextShimmer className="text-muted-foreground text-sm">
                            Thinking...
                          </TextShimmer>
                        ) : (
                          <MessageMarkdown>{text}</MessageMarkdown>
                        )}
                      </MessageContent>
                    </MessageStack>
                  </Message>
                );
              })}
            </>
          )}
        </ThreadContent>
        <ThreadScrollToBottom className="bottom-18 shadow-2xl" />
      </Thread>

    </div>
  );
}
