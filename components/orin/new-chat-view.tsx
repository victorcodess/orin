"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { ChatInput } from "@/components/orin/chat-input";
import {
  Suggestion,
  SuggestionList,
  Suggestions,
} from "@/components/nexus-ui/suggestions";
import { toast } from "@/components/nexus-ui/toaster";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";

const NEW_CHAT_SUGGESTIONS = [
  "I need to get something off my chest",
  "I have some amazing news to share",
  "Talk through a decision with me",
  "Help me reflect on my week",
] as const;

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
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[radial-gradient(110%_90%_at_50%_20%,transparent_55%,#f97015_150%)] p-4 pb-0 dark:bg-[radial-gradient(110%_90%_at_50%_20%,transparent_65%,#f97015_290%)]">
      <div className="absolute top-1/2 left-1/2 -mt-10 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-12">
        <div className="flex flex-col items-center justify-center gap-3 md:gap-2.75">
          {/* <HugeiconsIcon
            icon={CircleIcon}
            className="mb-4 size-12 shrink-0 fill-current/90 text-[#f97015]"
          /> */}
          <p className="text-muted-foreground text-center text-sm font-medium md:hidden">
            Good morning, Victor!
          </p>
          <h1 className="text-foreground font-heading md:leading-tighter w-full max-w-xs text-center text-2xl leading-tight tracking-tight md:max-w-lg md:text-3xl lg:text-4xl">
            {/* {assistant.firstMessage} */}
            What&apos;s on your mind?
          </h1>
        </div>

        <div className="hidden w-full max-w-2xl flex-col gap-6 md:flex">
          <ChatInput
            assistant={assistant}
            input={input}
            setInput={setInput}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
          />
          <Suggestions onSelect={setInput}>
            <SuggestionList className="justify-center">
              {NEW_CHAT_SUGGESTIONS.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  variant="outline"
                  className="text-foreground/90 h-9 font-medium"
                >
                  {suggestion}
                </Suggestion>
              ))}
            </SuggestionList>
          </Suggestions>
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
