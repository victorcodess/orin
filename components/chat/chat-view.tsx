"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
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

function textFromMessage(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
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
  const [input, setInput] = useState("");
  const sentInitialPrompt = useRef(false);

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
    [conversationId, input, isLoading, sendMessage]
  );

  const visibleMessages = messages.filter(
    (message) => message.role !== "system"
  );
  const lastMessage = visibleMessages.at(-1);
  const showTypingLoader =
    isLoading &&
    (!lastMessage ||
      lastMessage.role === "user" ||
      (lastMessage.role === "assistant" &&
        !textFromMessage(lastMessage).trim()));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
      <Thread className="min-h-0 flex-1">
        <ThreadContent className="mx-auto w-full max-w-3xl items-stretch">
          {visibleMessages.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-24 text-center">
              <p className="text-foreground text-lg font-medium">
                {assistant.name}
              </p>
              <p className="max-w-md text-sm">{assistant.firstMessage}</p>
            </div>
          ) : (
            <>
              {visibleMessages.map((message) => (
                <Message
                  key={message.id}
                  from={message.role === "user" ? "user" : "assistant"}
                >
                  <MessageStack>
                    <MessageContent>
                      <MessageMarkdown>
                        {textFromMessage(message)}
                      </MessageMarkdown>
                    </MessageContent>
                  </MessageStack>
                </Message>
              ))}
              {showTypingLoader ? (
                <Message from="assistant" aria-label="Assistant is typing">
                  <MessageStack>
                    <MessageContent>
                      <TextShimmer className="text-muted-foreground text-sm">
                        Thinking...
                      </TextShimmer>
                    </MessageContent>
                  </MessageStack>
                </Message>
              ) : null}
            </>
          )}
        </ThreadContent>
        <ThreadScrollToBottom className="bottom-18 shadow-2xl" />
      </Thread>

      <div className="h-[76px] w-full"></div>

      <div className="to-background from-background/30 absolute inset-x-0 bottom-0 flex items-center justify-center bg-linear-to-b to-15% px-4 pt-8 pb-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-3">
          <ChatInput
            assistant={assistant}
            input={input}
            setInput={setInput}
            isSubmitting={isLoading}
            handleSubmit={handleSubmit}
            onStop={stop}
          />
          <p className="text-muted-foreground text-xs font-[450]">
            Orin is an AI assistant and can make mistakes.
          </p>
        </div>
      </div>
    </div>
  );
}
