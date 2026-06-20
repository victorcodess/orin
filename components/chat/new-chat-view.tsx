"use client";

import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

import { useComposerStore } from "@/lib/stores/composer-store";
import { useConversationsStore } from "@/lib/stores/conversations-store";
import { ChatInput } from "@/components/chat/chat-input";
import { NewChatSuggestions } from "@/components/chat/new-chat-suggestions";
import { prefetchScribeToken } from "@/lib/elevenlabs/scribe-token-client";
import { toast } from "@/components/nexus-ui/toaster";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";

const EASE = [0.25, 0.1, 0.25, 1] as const;
const NEW_CHAT = "orin:new-chat";

export function signalNewChat() {
  window.dispatchEvent(new CustomEvent(NEW_CHAT));
}

export function NewChatView() {
  const assistant = DEFAULT_ASSISTANT;
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const controls = useAnimationControls();
  const setIsVisible = useComposerStore((state) => state.setIsVisible);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replay, setReplay] = useState(0);

  const play = useCallback(() => {
    controls.set("hidden");
    void controls.start("show");
  }, [controls]);

  useLayoutEffect(() => {
    setIsVisible(false);
    play();
  }, [play, setIsVisible]);

  useEffect(() => {
    prefetchScribeToken();
  }, []);

  useEffect(() => {
    const onNewChat = () => {
      setInput("");
      setIsSubmitting(false);
      setReplay((n) => n + 1);
      play();
    };

    window.addEventListener(NEW_CHAT, onNewChat);
    return () => window.removeEventListener(NEW_CHAT, onNewChat);
  }, [play, setInput]);

  const fade = {
    hidden: { opacity: reduceMotion ? 1 : 0 },
    show: {
      opacity: 1,
      transition: { duration: reduceMotion ? 0 : 0.35, ease: EASE },
    },
  };

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

        void useConversationsStore.getState().refresh();
        setInput("");
        router.push(
          `/c/${payload.id}?message=${encodeURIComponent(trimmed)}`
        );
      } catch (error) {
        toast.error("Couldn't start a new chat", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
        setIsSubmitting(false);
      }
    },
    [input, isSubmitting, router, setInput]
  );

  const chatInputProps = {
    assistant,
    input,
    setInput,
    isSubmitting,
    handleSubmit,
  };

  return (
    <motion.div
      className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4 pb-0"
      initial={false}
      // animate={controls}
      variants={fade}
    >
      <div className="absolute inset-0 bottom-0 size-full bg-[radial-gradient(110%_90%_at_50%_20%,transparent_55%,#f97015_150%)] dark:bg-[radial-gradient(110%_90%_at_50%_20%,transparent_60%,#f97015_280%)] md:dark:bg-[radial-gradient(110%_90%_at_50%_20%,transparent_65%,#f97015_290%)]" />
      <div className="absolute top-[calc(50%-138px)] left-1/2 -mt-10 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-12 px-10 md:top-[calc(50%-103.5px)] md:px-20">
        <div className="flex flex-col items-center justify-center gap-3 md:gap-2.75">
          <p className="text-muted-foreground text-center text-sm font-medium tracking-normal md:hidden">
            Good morning, Victor!
          </p>
          <h1 className="text-foreground font-heading md:leading-tighter w-full max-w-xs text-center text-[27px] leading-tight tracking-tight md:max-w-lg md:text-3xl lg:text-4xl">
            What&apos;s on your mind?
          </h1>
        </div>

        <div className="hidden w-full max-w-2xl flex-col gap-6 md:flex">
          <ChatInput {...chatInputProps} />
          <NewChatSuggestions
            key={`d-${replay}`}
            onSelect={setInput}
            placement="bottom"
          />
        </div>
      </div>

      <div className="mt-auto flex w-full max-w-3xl flex-col items-center gap-5 pb-5 text-center md:hidden">
        <NewChatSuggestions
          key={`m-${replay}`}
          onSelect={setInput}
          placement="top"
        />
        <ChatInput {...chatInputProps} />
      </div>
    </motion.div>
  );
}
