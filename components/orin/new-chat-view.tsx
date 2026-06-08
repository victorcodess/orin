"use client";

import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActionGroup,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/nexus-ui/prompt-input";
import { toast } from "@/components/nexus-ui/toaster";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";

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
          `/chat/${payload.id}?message=${encodeURIComponent(trimmed)}`,
        );
      } catch (error) {
        toast.error("Couldn't start a new chat", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
        setIsSubmitting(false);
      }
    },
    [input, isSubmitting, router],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-medium text-foreground">{assistant.name}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {assistant.firstMessage}
          </p>
        </div>

        <form
          className="w-full"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <PromptInput onSubmit={(value) => void handleSubmit(value)}>
            <PromptInputTextarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Message ${assistant.name}...`}
              disabled={isSubmitting}
            />
            <PromptInputActions>
              <PromptInputActionGroup />
              <PromptInputActionGroup>
                <PromptInputAction asChild>
                  <Button
                    type="submit"
                    size="icon"
                    className="size-8"
                    disabled={!input.trim() || isSubmitting}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                </PromptInputAction>
              </PromptInputActionGroup>
            </PromptInputActions>
          </PromptInput>
        </form>
      </div>
    </div>
  );
}
