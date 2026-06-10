"use client";

import { useRouter } from "next/navigation";
import { ArrowUp01Icon, CircleIcon } from "@hugeicons/core-free-icons";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActionGroup,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/nexus-ui/prompt-input";
import { toast } from "@/components/nexus-ui/toaster";
import { AssistantConfig, DEFAULT_ASSISTANT } from "@/lib/orin/defaults";

export function NewChatView() {
  const assistant = DEFAULT_ASSISTANT;
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (value?: string) => {
      const trimmed = (value ?? input).trim();
      if (!trimmed || isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ message: trimmed }),
        });
        const payload = (await response.json()) as {
          id?: string;
          error?: string;
        };

        if (!response.ok || !payload.id) {
          throw new Error(payload.error ?? "Failed to create chat");
        }

        window.dispatchEvent(new CustomEvent("orin:conversations-changed"));
        router.push(
          `/chat/${payload.id}?message=${encodeURIComponent(trimmed)}`
        );
      } catch (error) {
        toast.error("Couldn't start a new chat", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
        setIsSubmitting(false);
      }
    },
    [input, isSubmitting, router]
  );

  return (
    <div className="bg -white relative flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[radial-gradient(110%_90%_at_50%_20%,transparent_55%,#f97015_150%)] p-4 pb-0 dark:bg-[radial-gradient(110%_90%_at_50%_20%,transparent_65%,#f97015_290%)]">
      <div className="absolute top-1/2 left-1/2 -mt-10 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-12">
        <div className="flex flex-col items-center justify-center gap-1">
          <HugeiconsIcon
            icon={CircleIcon}
            className="mb-4 size-12 shrink-0 fill-current/90 text-[#f97015]"
          />
          <p className="text-muted-foreground text-center text-base font-medium">
            Hey, Victor!
          </p>
          <p className="text-foreground font-heading w-full max-w-xs text-center text-3xl leading-tight tracking-tight">
            {/* {assistant.firstMessage} */}
            What&apos;s on your mind?
          </p>
        </div>

        <div className="w-full max-w-2xl hidden md:block">
          <ChatInput
            assistant={assistant}
            input={input}
            setInput={setInput}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>

      <div className="mt-auto flex w-full max-w-3xl flex-col items-center gap-8 pb-5 text-center md:hidden">
        <ChatInput
          assistant={assistant}
          input={input}
          setInput={setInput}
          isSubmitting={isSubmitting}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

function ChatInput({
  assistant,
  input,
  setInput,
  isSubmitting,
  handleSubmit,
}: {
  assistant: AssistantConfig;
  input: string;
  setInput: (input: string) => void;
  isSubmitting: boolean;
  handleSubmit: (value?: string) => void;
}) {
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
        className="bg-sidebar dark:bg-border/90 shadow-sidebar-foreground/0 dark:shadow-sidebar-border/5 flex-row items-end rounded-4xl border-none shadow-sm backdrop-blur-lg"
      >
        <PromptInputTextarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`Message ${assistant.name}...`}
          disabled={isSubmitting}
          className="text-foreground min-h-0 flex-1 pt-2.5 pb-3.25 text-base! leading-7! font-medium px-6"
        />
        <PromptInputActions className="absolute right-0 w-fit shrink-0 py-2.5 px-2.5">
          <PromptInputActionGroup>
            <PromptInputAction asChild>
              <Button
                type="submit"
                size="icon"
                className="size-8"
                disabled={!input.trim() || isSubmitting}
              >
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  strokeWidth={2}
                  className="size-4 shrink-0"
                />
              </Button>
            </PromptInputAction>
          </PromptInputActionGroup>
        </PromptInputActions>
      </PromptInput>
    </form>
  );
}
