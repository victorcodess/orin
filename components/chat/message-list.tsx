"use client";

import { isTextUIPart, type UIMessage } from "ai";
import { useReducedMotion } from "motion/react";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { Call02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message,
  MessageContent,
  MessageMarkdown,
  MessageStack,
} from "@/components/nexus-ui/message";
import { TextShimmer } from "@/components/nexus-ui/text-shimmer";
import type { MessageRow } from "@/lib/ai/message-utils";
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
  messageSources?: Record<string, MessageRow["source"]>;
  isLoading: boolean;
  editingMessageId: string | null;
  readAloud: ReadAloudState;
  onRetry: (messageId: string) => void;
  onEdit: (messageId: string, text: string) => void;
  onCancelEdit: () => void;
  /**
   * Message id that should never play the entry fade. Used after a voice call
   * ends: the live transcript is replaced by the canonical DB thread (new ids),
   * and without this the last bubble would re-fade as if it were brand new.
   */
  noFadeMessageId?: string | null;
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
  messageSources = {},
  isLoading,
  editingMessageId,
  readAloud,
  onRetry,
  onEdit,
  onCancelEdit,
  noFadeMessageId = null,
}: ChatMessageListProps) {
  const reduceMotion = useReducedMotion();
  const initialLastId = useRef<{ conv: string; id: string | null }>({
    conv: conversationId,
    id: messages.at(-1)?.id ?? null,
  });
  const previousUserMessageRef = useRef<HTMLDivElement | null>(null);
  const [previousUserMessageHeight, setPreviousUserMessageHeight] = useState(0);

  if (initialLastId.current.conv !== conversationId) {
    initialLastId.current = {
      conv: conversationId,
      id: messages.at(-1)?.id ?? null,
    };
  } else if (initialLastId.current.id === null && messages.at(-1)?.id) {
    initialLastId.current.id = messages.at(-1)?.id ?? null;
  }

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

  // Stable keys for the first user/assistant bubble keep the new-chat intro
  // animation smooth across the optimistic→persisted swap. Everything else keys
  // on the (unique) message id, avoiding the duplicate-key collisions that
  // happened when consecutive assistant turns shared a preceding user message.
  const firstUserIndex = messages.findIndex((message) => message.role === "user");
  const firstAssistantIndex = messages.findIndex(
    (message) => message.role === "assistant",
  );
  const messageKeys = messages.map((message, index) => {
    if (message.role === "user" && index === firstUserIndex) {
      return `${conversationId}::user`;
    }
    if (message.role === "assistant" && index === firstAssistantIndex) {
      return `${conversationId}::assistant`;
    }
    return message.id;
  });

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
          : text.trim().length > 0 &&
            message.id !== PENDING_ASSISTANT_ID &&
            !(isLoading && isLast);
        const messageKey = messageKeys[index];
        const isVoiceMessage = messageSources[message.id] === "voice";
        const shouldFade =
          isLast &&
          !reduceMotion &&
          message.id !== initialLastId.current.id &&
          message.id !== noFadeMessageId;

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
                  className={cn(
                    isEditingMessage &&
                      "animate-pulse outline-1 outline-dashed outline-primary [&_svg]:opacity-0",
                    shouldFade &&
                      "animate-in fade-in-0 fill-mode-both duration-200",
                    shouldFade && isAssistant && "delay-150"
                  )}
                >
                  {showTyping ? (
                    <TextShimmer className="text-muted-foreground text-sm">
                      Thinking...
                    </TextShimmer>
                  ) : (
                    <>
                      {isVoiceMessage ? (
                        <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                          <HugeiconsIcon
                            icon={Call02Icon}
                            strokeWidth={2}
                            className="size-3.5 shrink-0"
                          />
                          <span>Spoken</span>
                        </div>
                      ) : null}
                      <MessageMarkdown>{text}</MessageMarkdown>
                    </>
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
                  className={cn(
                    shouldFade &&
                      isAssistant &&
                      "animate-in fade-in-0 fill-mode-both duration-200 delay-[120ms]"
                  )}
                />
              ) : null}
            </MessageStack>
          </Message>
        );
      })}
    </>
  );
}
