"use client";

import { isTextUIPart, type UIMessage } from "ai";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  Message,
  MessageContent,
  MessageMarkdown,
  MessageStack,
} from "@/components/nexus-ui/message";
import { TextShimmer } from "@/components/nexus-ui/text-shimmer";
import { cn } from "@/lib/utils";
import {
  ChatMessageActions,
  type ReadAloudState,
} from "@/components/chat/message-actions";

export const PENDING_ASSISTANT_ID = "__orin-pending-assistant__";

type ChatMessageListProps = {
  messages: UIMessage[];
  isLoading: boolean;
  editingMessageId: string | null;
  readAloud: ReadAloudState;
  onRetry: (messageId: string) => void;
  onEdit: (messageId: string, text: string) => void;
  onCancelEdit: () => void;
};

function textFromMessage(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

export function ChatMessageList({
  messages,
  isLoading,
  editingMessageId,
  readAloud,
  onRetry,
  onEdit,
  onCancelEdit,
}: ChatMessageListProps) {
  const previousUserMessageRef = useRef<HTMLDivElement | null>(null);
  const [previousUserMessageHeight, setPreviousUserMessageHeight] = useState(0);

  const lastIndex = messages.length - 1;
  const editingMessageIndex = editingMessageId
    ? messages.findIndex((message) => message.id === editingMessageId)
    : -1;
  const lastMessageIsAssistant = messages[lastIndex]?.role === "assistant";
  const previousUserMessageIndex = lastMessageIsAssistant
    ? messages.findLastIndex(
        (message, index) => index < lastIndex && message.role === "user"
      )
    : -1;
  const useAssistantMinHeight =
    lastMessageIsAssistant &&
    previousUserMessageIndex > -1 &&
    messages.some(
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

  return (
    <>
      {messages.map((message, index) => {
        const isLast = index === lastIndex;
        const isAssistant = message.role === "assistant";
        const isEditingMessage = message.id === editingMessageId;
        const fadeForEditing =
          editingMessageIndex > -1 && index > editingMessageIndex;
        const text = textFromMessage(message);
        const showTyping = isAssistant && isLast && isLoading && !text.trim();
        const showActions =
          text.trim().length > 0 && message.id !== PENDING_ASSISTANT_ID;

        return (
          <Message
            key={
              isAssistant && messages[index - 1]?.role === "user"
                ? `${messages[index - 1].id}::assistant`
                : message.id
            }
            ref={
              index === previousUserMessageIndex
                ? attachPreviousUserMessageRef
                : undefined
            }
            from={message.role === "user" ? "user" : "assistant"}
            className={cn(
              isLast &&
                useAssistantMinHeight &&
                "min-h- [calc(var(--orin-thread-height)-var(--orin-prev-user-height)-var(--orin-thread-content-gap)-var(--orin-thread-content-bottom-padding)-var(--orin-min-height-misc))]",
              fadeForEditing && "opacity-50",
              "transition-opacity duration-300"
            )}
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
              <MessageContent
                className={
                  isEditingMessage
                    ? "animate-pulse outline-1 outline-dashed outline-primary [&_svg]:opacity-0"
                    : undefined
                }
              >
                {showTyping ? (
                  <TextShimmer className="text-muted-foreground text-sm">
                    Thinking...
                  </TextShimmer>
                ) : (
                  <MessageMarkdown>{text}</MessageMarkdown>
                )}
              </MessageContent>
              {showActions ? (
                <ChatMessageActions
                  from={message.role === "user" ? "user" : "assistant"}
                  messageId={message.id}
                  text={text}
                  isLoading={isLoading}
                  isEditing={isEditingMessage}
                  readAloud={readAloud}
                  onRetry={onRetry}
                  onEdit={onEdit}
                  onCancelEdit={onCancelEdit}
                />
              ) : null}
            </MessageStack>
          </Message>
        );
      })}
    </>
  );
}
