"use client";

import { ArrowUp01Icon, Mic02Icon } from "@hugeicons/core-free-icons";
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
};

export function ChatInput({
  assistant,
  input,
  setInput,
  isSubmitting,
  handleSubmit,
}: ChatInputProps) {
  const [textareaRef, isMultiline] = useMultilineTextarea(input);

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
          isMultiline ? "flex-col rounded-3xl" : "flex-row items-end rounded-4xl"
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
            "text-foreground w-full shrink-0 px-6 pt-3 pb-3 text-base! leading-7! font-[450]",
            isMultiline
              ? "field-sizing-content min-h-0! max-h-40 flex-1"
              : "field-sizing-fixed! min-h-0! max-h-none overflow-hidden",
          )}
        />
        <PromptInputActions
          className={cn(
            "shrink-0",
            isMultiline
              ? "justify-end px-2.25 py-2"
              : "absolute right-0 bottom-0 w-fit px-2.25 py-2"
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
            </PromptInputAction>
          </PromptInputActionGroup>
        </PromptInputActions>
      </PromptInput>
    </form>
  );
}

function useMultilineTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      // Mobile browsers inflate empty textarea scrollHeight; never treat empty as multiline.
      if (!value.trim()) {
        setIsMultiline(false);
        return;
      }

      const styles = getComputedStyle(el);
      const lineHeight = Number.parseFloat(styles.lineHeight);
      const paddingY =
        Number.parseFloat(styles.paddingTop) +
        Number.parseFloat(styles.paddingBottom);
      setIsMultiline(el.scrollHeight > lineHeight + paddingY + 1);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return [ref, isMultiline] as const;
}
