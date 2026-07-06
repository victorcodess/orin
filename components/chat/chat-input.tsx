"use client";

import { useConversationInput } from "@elevenlabs/react";
import {
  ArrowUp02Icon,
  StopIcon,
  Mic01Icon,
  MicOff01Icon,
  ExpandIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  SpeechInput,
  SpeechInputCancelButton,
  SpeechInputPreview,
  SpeechInputRecordButton,
  useSpeechInput,
} from "@/components/elevenlabs/speech-input";
import { PersonalitySelector } from "@/components/chat/personality-selector";
import { toast } from "@/components/nexus-ui/toaster";
import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActionGroup,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/nexus-ui/prompt-input";
import { useVoiceOrb } from "@/components/voice/use-voice-orb";
import {
  VoiceCallTooltip,
  voiceCallEndKeys,
  voiceCallModeKeys,
  voiceCallMuteKeys,
} from "@/components/voice/voice-call-keyboard-shortcuts";
import { VoiceActivityIndicator } from "@/components/voice/voice-activity-indicator";
import { VoicePill } from "@/components/voice/voice-pill";
import { getVoiceOrbColors } from "@/lib/elevenlabs/voices";
import { CommitStrategy } from "@/lib/hooks/use-scribe";
import {
  getScribeToken,
  prefetchDictationToken,
  warmDictation,
} from "@/lib/elevenlabs/scribe-token-client";
import {
  enterLabel,
  hasPrimaryModifier,
  isKeyboardShortcutsDialogOpen,
  matchesShortcut,
} from "@/lib/ui/keyboard-shortcuts";
import { ORIN_NAME } from "@/lib/orin/defaults";
import { useAssistantConfig } from "@/lib/stores/assistant-config-store";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  input: string;
  setInput: (input: string) => void;
  isSubmitting: boolean;
  handleSubmit: (value?: string) => void;
  onStop?: () => void;
};

export function ChatInput({
  input,
  setInput,
  isSubmitting,
  handleSubmit,
  onStop,
}: ChatInputProps) {
  const [textareaRef, isMultirow, isMultiline] = useResponsiveTextarea(input);
  const dictationBaseInputRef = useRef("");
  const inputRef = useRef(input);
  inputRef.current = input;

  const callStatus = useVoiceCallStore((state) => state.status);
  const toggleMode = useVoiceCallStore((state) => state.toggleMode);
  const setDisconnecting = useVoiceCallStore((state) => state.setDisconnecting);
  // Render the call panel whenever a call is live (any mode). In fullscreen it
  // sits behind the overlay so collapsing back reveals it without a flash.
  const isCallActive = callStatus !== "idle";
  // const isCallActive = true;

  const { isMuted, setMuted } = useConversationInput();
  const { activity, agentState, getInputVolume, getOutputVolume } = useVoiceOrb();
  const { voiceId } = useAssistantConfig();

  useEffect(() => {
    prefetchDictationToken();
  }, []);

  return (
    <form
      className="relative w-full"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <PromptInput
        onSubmit={(value) => void handleSubmit(value)}
        className={cn(
          "bg-sidebar dark:bg-border/90 shadow-sidebar-foreground/15 dark:shadow-sidebar-border/5 border-none shadow-xs backdrop-blur-lg transition-opacity duration-200 ease-out dark:shadow-sm",
          isMultirow
            ? "flex-col rounded-3xl"
            : "flex-row items-end justify-end rounded-4xl",
          isCallActive && "pointer-events-none opacity-0"
        )}
      >
        <PromptInputTextarea
          ref={textareaRef}
          rows={isMultiline ? undefined : 1}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onFocus={() => prefetchDictationToken()}
          placeholder={`Message ${ORIN_NAME}...`}
          disabled={isSubmitting}
          className={cn(
            "text-foreground w-full px-6 pt-3 pb-3 text-base leading-7 font-[450] placeholder:text-sm placeholder:leading-7 md:text-[15px]",
            isMultiline
              ? "field-sizing-content max-h-40 min-h-0! flex-1 shrink-0 overflow-y-auto"
              : "field-sizing-fixed! max-h-none min-h-0! overflow-hidden"
          )}
        />
        <PromptInputActions
          className={cn(
            "shrink-0",
            isMultirow
              ? "justify-end px-2.25 py-2"
              : "w-fit justify-end px-2.25 py-2"
          )}
        >
          <PromptInputActionGroup>
            <PersonalitySelector disabled={isSubmitting} />
            <SpeechInput
              className="rounded-full"
              getToken={getScribeToken}
              commitStrategy={CommitStrategy.VAD}
              onStart={() => {
                dictationBaseInputRef.current = inputRef.current;
              }}
              onChange={({ transcript }) => {
                setInput(
                  appendDictation(dictationBaseInputRef.current, transcript)
                );
              }}
              onCancel={() => {
                setInput(dictationBaseInputRef.current);
              }}
              onError={toastDictationError}
              onAuthError={({ error }) => {
                toastDictationError(new Error(error));
              }}
              onQuotaExceededError={({ error }) => {
                toastDictationError(new Error(error));
              }}
            >
              <DictationKeyboardShortcuts disabled={isSubmitting} />
              <SpeechInputRecordButton
                variant="ghost"
                className="hover:bg-input hover:dark:bg-popover size-9"
              />
              <SpeechInputPreview placeholder="Listening…" />
              <SpeechInputCancelButton
                variant="ghost"
                disabled={isSubmitting}
                className="hover:bg-input hover:dark:bg-popover"
                onPointerEnter={() => warmDictation()}
              />
            </SpeechInput>
            <PromptInputAction
              asChild
              tooltip={
                isSubmitting && onStop
                  ? undefined
                  : {
                      content: "Send message",
                      side: "top",
                      shortcut: enterLabel(),
                    }
              }
            >
              {isSubmitting && onStop ? (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="size-9"
                  onClick={onStop}
                >
                  <HugeiconsIcon
                    icon={StopIcon}
                    strokeWidth={2}
                    className="size-3.75 shrink-0"
                  />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="size-9"
                  disabled={!input.trim() || isSubmitting}
                >
                  <HugeiconsIcon
                    icon={ArrowUp02Icon}
                    strokeWidth={2}
                    className="text-foreground size-4.5 shrink-0"
                  />
                </Button>
              )}
            </PromptInputAction>
          </PromptInputActionGroup>
        </PromptInputActions>
      </PromptInput>

      <div
        className={cn(
          "absolute inset-0 flex items-center gap-2 transition-opacity duration-200 ease-out",
          isCallActive ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!isCallActive}
      >
        <VoiceCallTooltip
          label={isMuted ? "Unmute microphone" : "Mute microphone"}
          keys={voiceCallMuteKeys()}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon-xl"
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
            onClick={() => setMuted(!isMuted)}
          >
            <HugeiconsIcon
              icon={isMuted ? MicOff01Icon : Mic01Icon}
              strokeWidth={2}
              className="size-5.5 shrink-0"
            />
          </Button>
        </VoiceCallTooltip>
        <VoiceCallTooltip label="Expand call" keys={voiceCallModeKeys()}>
          <Button
            type="button"
            variant="secondary"
            size="icon-xl"
            aria-label="Expand call"
            onClick={toggleMode}
          >
            <HugeiconsIcon
              icon={ExpandIcon}
              strokeWidth={2}
              className="size-5.5 shrink-0"
            />
          </Button>
        </VoiceCallTooltip>
        {isCallActive ? (
          <div className="relative h-14 w-full">
            <VoiceActivityIndicator
              activity={activity}
              className="absolute bottom-full left-1/2 mb-6 -translate-x-1/2"
            />
            <VoicePill
              state={agentState}
              getInputVolume={getInputVolume}
              getOutputVolume={getOutputVolume}
              colors={getVoiceOrbColors(voiceId)}
              className="h-14 w-full"
            />
          </div>
        ) : (
          <div className="h-14 w-full" />
        )}
        <VoiceCallTooltip label="End call" keys={voiceCallEndKeys()}>
          <Button
            type="button"
            variant="destructive"
            size="icon-xl"
            aria-label="End call"
            onClick={() => setDisconnecting()}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-5.5 shrink-0"
            />
          </Button>
        </VoiceCallTooltip>
      </div>
    </form>
  );
}

function DictationKeyboardShortcuts({ disabled }: { disabled: boolean }) {
  const { isConnected, isActive, isConnecting, start, stop, cancel } =
    useSpeechInput();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || isKeyboardShortcutsDialogOpen()) {
        return;
      }

      if (matchesShortcut(event, "d", { shift: true }) && !event.altKey) {
        event.preventDefault();

        if (isActive) {
          cancel();
          return;
        }

        warmDictation();
        void start();
        return;
      }

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !hasPrimaryModifier(event) &&
        !event.altKey &&
        isConnected &&
        !isConnecting
      ) {
        event.preventDefault();
        stop();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [disabled, isConnected, isActive, isConnecting, start, stop, cancel]);

  return null;
}

function appendDictation(baseInput: string, transcript: string) {
  const text = transcript.trim();
  if (!text) {
    return baseInput;
  }

  const separator = baseInput.trim() ? " " : "";
  return `${baseInput}${separator}${text}`;
}

function toastDictationError(error: Error | Event) {
  toast.error("Couldn't start dictation", {
    description:
      error instanceof Error
        ? error.message
        : "Check microphone permissions and try again.",
  });
}

function useResponsiveTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [mode, setMode] = useState<"row" | "stack" | "multi">("row");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      if (value === "") {
        setMode("row");
        return;
      }

      const hasHardBreak = value.includes("\n");
      const wasStacked = mode !== "row";
      const isMultirow =
        hasHardBreak ||
        (wasStacked ? exceedsSingleRowWidth(el, value, contextRef) : wraps(el));
      const isMultiline =
        isMultirow && (hasHardBreak || (wasStacked && wraps(el)));

      setMode(isMultiline ? "multi" : isMultirow ? "stack" : "row");
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode, value]);

  return [ref, mode !== "row", mode === "multi"] as const;
}

function wraps(textarea: HTMLTextAreaElement) {
  const styles = getComputedStyle(textarea);

  return textarea.scrollHeight > px(styles.lineHeight) + y(styles) + 1;
}

function exceedsSingleRowWidth(
  textarea: HTMLTextAreaElement,
  value: string,
  contextRef: { current: CanvasRenderingContext2D | null }
) {
  const styles = getComputedStyle(textarea);
  const context = (contextRef.current ??= document
    .createElement("canvas")
    .getContext("2d"));
  if (!context) {
    return false;
  }

  context.font = styles.font;
  const actions = textarea.nextElementSibling;
  const buttons = actions?.firstElementChild;
  const reserved =
    (buttons instanceof HTMLElement
      ? buttons.getBoundingClientRect().width
      : 0) +
    (actions instanceof HTMLElement
      ? inlineSize(getComputedStyle(actions))
      : 0);
  const textWidth =
    context.measureText(value).width +
    Math.max(value.length - 1, 0) * px(styles.letterSpacing);
  const rowWidth =
    (textarea.parentElement?.clientWidth ?? textarea.clientWidth) -
    reserved -
    inlineSize(styles);

  return textWidth > rowWidth;
}

function y(styles: CSSStyleDeclaration) {
  return px(styles.paddingTop) + px(styles.paddingBottom);
}

function inlineSize(styles: CSSStyleDeclaration) {
  return (
    px(styles.paddingLeft) +
    px(styles.paddingRight) +
    px(styles.borderLeftWidth) +
    px(styles.borderRightWidth)
  );
}

function px(value: string) {
  return Number.parseFloat(value) || 0;
}
