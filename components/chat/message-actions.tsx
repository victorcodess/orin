"use client";

import {
  Copy01Icon,
  Edit03Icon,
  Loading03Icon,
  PauseIcon,
  PlayIcon,
  Refresh04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  MessageAction,
  MessageActionGroup,
  MessageActions,
} from "@/components/nexus-ui/message";
import { Button } from "@/components/ui/button";
import type { ReadAloudState } from "@/lib/hooks/use-read-aloud";
import { cn } from "@/lib/utils";

const COPIED_RESET_MS = 1500;
const messageActionButtonClassName =
  "text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:dark:bg-secondary/70";

const SPEECH_UI_EASE = [0.25, 0.1, 0.25, 1] as const;

function speechUiTransition(reduceMotion: boolean | null, duration = 0.2) {
  return reduceMotion ? { duration: 0 } : { duration, ease: SPEECH_UI_EASE };
}

function speechUiIconMotion(reduceMotion: boolean | null) {
  const blur = reduceMotion ? "blur(0px)" : "blur(1px)";

  return {
    initial: { opacity: 0, scale: 0.9, filter: blur },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: {
      opacity: 0,
      scale: 0.9,
      filter: blur,
      transition: speechUiTransition(reduceMotion, 0.15),
    },
    transition: speechUiTransition(reduceMotion, 0.2),
  } as const;
}

type ReadAloudIconState = "loading" | "pause" | "play";

type ChatMessageActionsProps = {
  from: "user" | "assistant";
  messageId: string;
  text: string;
  isLoading: boolean;
  isEditing: boolean;
  readAloud: ReadAloudState;
  voiceCallActive?: boolean;
  onRetry: (messageId: string) => void;
  onEdit: (messageId: string, text: string) => void;
  onCancelEdit: () => void;
  className?: string;
};

function CopyMessageAction({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, COPIED_RESET_MS);
    });
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <MessageAction asChild tooltip={copied ? "Copied" : "Copy"}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={messageActionButtonClassName}
        aria-label={copied ? "Copied message" : "Copy message"}
        disabled={!text.trim()}
        onClick={handleCopy}
      >
        <HugeiconsIcon
          icon={copied ? Tick02Icon : Copy01Icon}
          strokeWidth={1.75}
          className={copied ? "size-4.5" : "size-4"}
        />
      </Button>
    </MessageAction>
  );
}

function readAloudActionMotion(reduceMotion: boolean | null) {
  const blur = reduceMotion ? "blur(0px)" : "blur(2px)";

  return {
    initial: { opacity: 0, scale: 0.88, maxWidth: 0, filter: blur },
    animate: {
      opacity: 1,
      scale: 1,
      maxWidth: 40,
      filter: "blur(0px)",
    },
    exit: {
      opacity: 0,
      scale: 0.88,
      maxWidth: 0,
      filter: blur,
      transition: speechUiTransition(reduceMotion, 0.15),
    },
    transition: speechUiTransition(reduceMotion, 0.2),
  } as const;
}

function ReadAloudMessageAction({
  messageId,
  text,
  readAloud,
}: {
  messageId: string;
  text: string;
  readAloud: ReadAloudState;
}) {
  const isReading = readAloud.activeMessageId === messageId;
  const isLoadingAudio = isReading && readAloud.isLoading;
  const isPlaying = isReading && !readAloud.isPaused && !readAloud.isLoading;
  const reduceMotion = useReducedMotion();
  const iconState: ReadAloudIconState = isLoadingAudio
    ? "loading"
    : isPlaying
      ? "pause"
      : "play";

  const handleReadAloud = useCallback(() => {
    void readAloud.toggle(messageId, text);
  }, [messageId, readAloud, text]);

  return (
    <MessageAction
      asChild
      tooltip={
        isLoadingAudio
          ? "Loading audio"
          : isPlaying
            ? "Pause"
            : isReading
              ? "Resume"
              : "Read aloud"
      }
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={cn(
          messageActionButtonClassName,
          isPlaying && "text-foreground"
        )}
        aria-label={
          isLoadingAudio
            ? "Loading audio"
            : isPlaying
              ? "Pause reading message"
              : isReading
                ? "Resume reading message"
                : "Read message aloud"
        }
        aria-busy={isLoadingAudio}
        disabled={isLoadingAudio}
        onClick={handleReadAloud}
      >
        <span className="relative flex size-4.5 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {iconState === "loading" ? (
              <motion.span
                key="loading"
                {...speechUiIconMotion(reduceMotion)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={1.75}
                  className="size-4.5 animate-spin"
                />
              </motion.span>
            ) : iconState === "pause" ? (
              <motion.span
                key="pause"
                {...speechUiIconMotion(reduceMotion)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <HugeiconsIcon
                  icon={PauseIcon}
                  strokeWidth={1.75}
                  className="size-4.5"
                />
              </motion.span>
            ) : (
              <motion.span
                key="play"
                {...speechUiIconMotion(reduceMotion)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <HugeiconsIcon
                  icon={PlayIcon}
                  strokeWidth={1.75}
                  className="size-4.5"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </Button>
    </MessageAction>
  );
}

export function ChatMessageActions({
  from,
  messageId,
  text,
  isLoading,
  isEditing,
  readAloud,
  voiceCallActive = false,
  onRetry,
  onEdit,
  onCancelEdit,
  className,
}: ChatMessageActionsProps) {
  const isAssistant = from === "assistant";
  const reduceMotion = useReducedMotion();

  return (
    <MessageActions
      className={cn(
        "transition-opacity duration-150",
        className,
        isAssistant
          ? "opacity-100"
          : "md:opacity-0 group-hover/message:opacity-100 focus-within:opacity-100"
      )}
    >
      <MessageActionGroup className="gap-0">
        <CopyMessageAction text={text} />
        {isAssistant ? (
          <>
            <AnimatePresence initial={false}>
              {!voiceCallActive ? (
                <motion.div
                  key="read-aloud"
                  {...readAloudActionMotion(reduceMotion)}
                  className="overflow-hidden"
                >
                  <ReadAloudMessageAction
                    messageId={messageId}
                    text={text}
                    readAloud={readAloud}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <MessageAction asChild tooltip="Retry">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={messageActionButtonClassName}
                aria-label="Retry response"
                disabled={isLoading}
                onClick={() => onRetry(messageId)}
              >
                <HugeiconsIcon
                  icon={Refresh04Icon}
                  strokeWidth={1.75}
                  className="size-4"
                />
              </Button>
            </MessageAction>
          </>
        ) : (
          <MessageAction asChild tooltip={isEditing ? "Cancel edit" : "Edit"}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={messageActionButtonClassName}
              aria-label={isEditing ? "Cancel editing message" : "Edit message"}
              disabled={isLoading}
              onClick={() => {
                if (isEditing) {
                  onCancelEdit();
                  return;
                }

                onEdit(messageId, text);
              }}
            >
              <HugeiconsIcon
                icon={Edit03Icon}
                strokeWidth={1.75}
                className="size-4"
              />
            </Button>
          </MessageAction>
        )}
      </MessageActionGroup>
    </MessageActions>
  );
}

export type { ReadAloudState } from "@/lib/hooks/use-read-aloud";
