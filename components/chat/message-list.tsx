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
export const OPTIMISTIC_USER_ID = "__orin-optimistic-user__";

type ChatMessageListProps = {
  conversationId: string;
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
  conversationId,
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

  const firstUserIndex = messages.findIndex((message) => message.role === "user");

  return (
    <>
      {messages.map((message, index) => {
        const isLast = index === lastIndex;
        const isAssistant = message.role === "assistant";
        const isEditingMessage = message.id === editingMessageId;
        const fadeForEditing =
          editingMessageIndex > -1 && index > editingMessageIndex;
        const text = textFromMessage(message);
        const showTyping =
          isAssistant &&
          isLast &&
          (isLoading || message.id === PENDING_ASSISTANT_ID) &&
          !text.trim();
        const isUser = message.role === "user";
        const showActions = isUser
          ? text.trim().length > 0
          : text.trim().length > 0 && message.id !== PENDING_ASSISTANT_ID;
        const precedingUserMessage = isAssistant
          ? messages
              .slice(0, index)
              .findLast((item) => item.role === "user")
          : undefined;
        const assistantMessageIndex = isAssistant
          ? messages
              .slice(0, index + 1)
              .filter((item) => item.role === "assistant").length
          : 0;
        const messageKey =
          message.role === "user" && index === firstUserIndex
            ? `${conversationId}::user`
            : isAssistant && precedingUserMessage
              ? assistantMessageIndex === 1
                ? `${conversationId}::assistant`
                : `${precedingUserMessage.id}::assistant`
              : message.id;

        return (
          <Message
            key={messageKey}
            ref={
              index === previousUserMessageIndex
                ? attachPreviousUserMessageRef
                : undefined
            }
            from={message.role === "user" ? "user" : "assistant"}
            className={cn(
              // isLast &&
              //   useAssistantMinHeight &&
              //   "min-h-[calc(var(--orin-thread-height)-var(--orin-prev-user-height)-var(--orin-thread-content-gap)-var(--orin-thread-content-bottom-padding)-var(--orin-min-height-misc))]",
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
