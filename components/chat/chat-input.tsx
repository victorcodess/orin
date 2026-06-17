"use client";

import { ArrowUp01Icon, Mic02Icon, StopIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActionGroup,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/nexus-ui/prompt-input";
import { AssistantConfig } from "@/lib/orin/defaults";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  assistant: AssistantConfig;
  input: string;
  setInput: (input: string) => void;
  isSubmitting: boolean;
  handleSubmit: (value?: string) => void;
  onStop?: () => void;
};

export function ChatInput({
  assistant,
  input,
  setInput,
  isSubmitting,
  handleSubmit,
  onStop,
}: ChatInputProps) {
  const [textareaRef, isMultirow, isMultiline] = useResponsiveTextarea(input);

  return (
    <form
      className="w-full"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      <PromptInput
        onSubmit={(value) => void handleSubmit(value)}
        className={cn(
          "bg-sidebar dark:bg-border/90 shadow-sidebar-foreground/0 dark:shadow-sidebar-border/5 border-none shadow-sm backdrop-blur-lg",
          isMultirow
            ? "flex-col rounded-3xl"
            : "flex-row items-end justify-end rounded-4xl"
        )}
      >
        <PromptInputTextarea
          ref={textareaRef}
          rows={isMultiline ? undefined : 1}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Message ${assistant.name}...`}
          disabled={isSubmitting}
          className={cn(
            "text-foreground w-full px-6 pt-3 pb-3 text-base! leading-7! font-[450]",
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
            <PromptInputAction asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="hover:bg-sidebar-accent/60 size-9"
              >
                <HugeiconsIcon
                  icon={Mic02Icon}
                  strokeWidth={2}
                  className="text-foreground/90 size-4.5 shrink-0"
                />
              </Button>
            </PromptInputAction>
            <PromptInputAction asChild>
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
                    className="size-3.5 shrink-0"
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
                    icon={ArrowUp01Icon}
                    strokeWidth={2}
                    className="text-foreground size-4.5 shrink-0"
                  />
                </Button>
              )}
            </PromptInputAction>
          </PromptInputActionGroup>
        </PromptInputActions>
      </PromptInput>
    </form>
  );
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
      const isMultiline = isMultirow && (hasHardBreak || (wasStacked && wraps(el)));

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
  const context =
    contextRef.current ??= document.createElement("canvas").getContext("2d");
  if (!context) {
    return false;
  }

  context.font = styles.font;
  const actions = textarea.nextElementSibling;
  const buttons = actions?.firstElementChild;
  const reserved =
    (buttons instanceof HTMLElement ? buttons.getBoundingClientRect().width : 0) +
    (actions instanceof HTMLElement ? inlineSize(getComputedStyle(actions)) : 0);
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
