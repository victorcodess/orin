"use client";

import { isTextUIPart, type UIMessage } from "ai";
import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
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

const FADE_EASE = [0.25, 0.1, 0.25, 1] as const;

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

// Mirrors the reference: the assistant's column fades in on its own (delay 0)
// inside the row wrapper (delay 0.14), so the "Thinking" indicator, the streamed
// reply, and the actions share one container that fades exactly once. The user
// column has no inner fade — only the outer row wrapper animates it.
function AssistantColumn({
  isAssistant,
  shouldIntro,
  children,
}: {
  isAssistant: boolean;
  shouldIntro: boolean;
  children: ReactNode;
}) {
  if (!isAssistant) {
    return <>{children}</>;
  }

  return (
    <motion.div
      className="flex min-w-0 flex-1 flex-col"
      initial={shouldIntro ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0, ease: FADE_EASE }}
    >
      {children}
    </motion.div>
  );
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

  // Stable keys keep a row mounted (so it fades exactly once) across the
  // optimistic→persisted and pending→real swaps. The first user bubble is keyed
  // to the conversation for the new-chat intro; every assistant is paired to its
  // preceding user so the "Thinking" shimmer and the streamed reply are the same
  // row and never remount mid-stream.
  const firstUserIndex = messages.findIndex((message) => message.role === "user");
  const userKey = (index: number) =>
    index === firstUserIndex ? `${conversationId}::user` : messages[index]?.id;
  const messageKeys = messages.map((message, index) => {
    if (message.role !== "assistant") {
      return userKey(index);
    }
    const previous = messages[index - 1];
    if (previous?.role === "user") {
      return `${userKey(index - 1)}::assistant`;
    }
    return message.id;
  });

  // Fade a row only the first time it appears. Re-seed on conversation switch
  // (navigation) and on the post-call thread swap (noFadeMessageId) so neither
  // re-fades the whole, already-visible thread.
  const introSeedRef = useRef<{
    conv: string;
    noFade: string | null;
    keys: Set<string>;
  } | null>(null);
  if (
    !introSeedRef.current ||
    introSeedRef.current.conv !== conversationId ||
    introSeedRef.current.noFade !== noFadeMessageId
  ) {
    introSeedRef.current = {
      conv: conversationId,
      noFade: noFadeMessageId,
      keys: new Set(messageKeys),
    };
  }
  const introSuppressedKeys = introSeedRef.current.keys;

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
        const shouldIntro = !reduceMotion && !introSuppressedKeys.has(messageKey);

        return (
          <motion.div
            key={messageKey}
            className="w-full"
            initial={shouldIntro ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.3,
              ease: FADE_EASE,
              delay: isAssistant ? 0.14 : 0,
            }}
          >
            <Message
              ref={
                index === previousUserMessageIndex
                  ? attachPreviousUserMessageRef
                  : undefined
              }
              from={message.role === "user" ? "user" : "assistant"}
              className={cn(
                isLast &&
                  useAssistantMinHeight &&
                  "min-h-[calc(var(--orin-thread-height)-var(--orin-prev-user-height)-var(--orin-thread-content-gap)-var(--orin-thread-content-bottom-padding)-var(--orin-min-height-misc))]",
                fadeForEditing && "opacity-50 transition-opacity duration-300"
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
              <AssistantColumn
                isAssistant={isAssistant}
                shouldIntro={shouldIntro}
              >
                <MessageStack>
                  <MessageContent
                    className={cn(
                      isEditingMessage &&
                        "animate-pulse outline-1 outline-dashed outline-primary [&_svg]:opacity-0"
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
                    />
                  ) : null}
                </MessageStack>
              </AssistantColumn>
            </Message>
          </motion.div>
        );
      })}
    </>
  );
}
