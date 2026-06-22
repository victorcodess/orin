"use client";

import {
  Copy01Icon,
  Edit03Icon,
  PauseIcon,
  PlayIcon,
  Refresh04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  MessageAction,
  MessageActionGroup,
  MessageActions,
} from "@/components/nexus-ui/message";
import { toast } from "@/components/nexus-ui/toaster";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const COPIED_RESET_MS = 1500;
const messageActionButtonClassName =
  "text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:dark:bg-secondary/70";

type ReadAloudState = {
  activeMessageId: string | null;
  isPaused: boolean;
  setActiveMessageId: Dispatch<SetStateAction<string | null>>;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
};

type ChatMessageActionsProps = {
  from: "user" | "assistant";
  messageId: string;
  text: string;
  isLoading: boolean;
  isEditing: boolean;
  readAloud: ReadAloudState;
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
  const isPlaying = isReading && !readAloud.isPaused;

  const handleReadAloud = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      toast.error("Read aloud isn't supported in this browser");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.pause();
      readAloud.setIsPaused(true);
      return;
    }

    if (isReading && readAloud.isPaused) {
      window.speechSynthesis.resume();
      readAloud.setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      readAloud.setActiveMessageId((current) =>
        current === messageId ? null : current
      );
      readAloud.setIsPaused(false);
    };
    utterance.onerror = () => {
      readAloud.setActiveMessageId((current) =>
        current === messageId ? null : current
      );
      readAloud.setIsPaused(false);
    };

    readAloud.setActiveMessageId(messageId);
    readAloud.setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  }, [isPlaying, isReading, messageId, readAloud, text]);

  return (
    <MessageAction
      asChild
      tooltip={isPlaying ? "Pause" : isReading ? "Resume" : "Read aloud"}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={messageActionButtonClassName}
        aria-label={
          isPlaying
            ? "Pause reading message"
            : isReading
              ? "Resume reading message"
              : "Read message aloud"
        }
        onClick={handleReadAloud}
      >
        <HugeiconsIcon
          icon={isPlaying ? PauseIcon : PlayIcon}
          strokeWidth={1.75}
          className="size-4.5"
        />
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
  onRetry,
  onEdit,
  onCancelEdit,
  className,
}: ChatMessageActionsProps) {
  const isAssistant = from === "assistant";

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
            <ReadAloudMessageAction
              messageId={messageId}
              text={text}
              readAloud={readAloud}
            />
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

export type { ReadAloudState };
