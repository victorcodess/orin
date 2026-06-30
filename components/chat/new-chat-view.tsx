"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { NewChatSuggestions } from "@/components/chat/new-chat-suggestions";
import { useNewChatVoiceCall } from "@/lib/hooks/use-new-chat-voice-call";
import { titleFromUserMessage } from "@/lib/conversation-title";
import { prefetchDictationToken } from "@/lib/elevenlabs/scribe-token-client";
import { setPendingFirstMessage } from "@/lib/pending-first-message";
import { useConversationsStore } from "@/lib/stores/conversations-store";
import { cn } from "@/lib/utils";

const EASE = [0.25, 0.1, 0.25, 1] as const;
export const NEW_CHAT_EVENT = "orin:new-chat";

export function signalNewChat() {
  window.dispatchEvent(new CustomEvent(NEW_CHAT_EVENT));
}

export function NewChatView() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { suppressChrome } = useNewChatVoiceCall();
  const [input, setInput] = useState("");
  const [replay, setReplay] = useState(0);
  const submitLockRef = useRef(false);

  useLayoutEffect(() => {
    submitLockRef.current = false;
  }, []);

  useEffect(() => {
    prefetchDictationToken();
  }, []);

  useEffect(() => {
    const onNewChat = () => {
      setInput("");
      submitLockRef.current = false;
      setReplay((n) => n + 1);
    };

    window.addEventListener(NEW_CHAT_EVENT, onNewChat);
    return () => window.removeEventListener(NEW_CHAT_EVENT, onNewChat);
  }, []);

  const handleSubmit = useCallback(
    (value?: string) => {
      const trimmed = (value ?? input).trim();
      if (!trimmed || submitLockRef.current) {
        return;
      }

      submitLockRef.current = true;
      const conversationId = crypto.randomUUID();
      const now = new Date().toISOString();

      useConversationsStore.getState().prependConversation({
        id: conversationId,
        title: titleFromUserMessage(trimmed),
        is_favorited: false,
        created_at: now,
        updated_at: now,
      });
      setPendingFirstMessage(conversationId, trimmed);
      setInput("");
      router.push(`/c/${conversationId}?new=1`);
    },
    [input, router],
  );

  const chatInputProps = {
    input,
    setInput,
    isSubmitting: false,
    handleSubmit,
  };

  const chromeClass = cn(
    "transition-opacity duration-250 ease-out",
    suppressChrome && "pointer-events-none opacity-0",
  );

  return (
    <motion.div
      className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center p-4 pb-0"
      initial={{ opacity: reduceMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        ease: EASE,
      }}
    >
      <div className="absolute inset-0 bottom-0 size-full bg-[radial-gradient(110%_90%_at_50%_20%,transparent_55%,#f97015_150%)] dark:bg-[radial-gradient(110%_90%_at_50%_20%,transparent_60%,#f97015_280%)] md:dark:bg-[radial-gradient(110%_90%_at_50%_20%,transparent_65%,#f97015_290%)]" />
      <div className="absolute top-[calc(50%-138px)] left-1/2 -mt-10 flex w-full -translate-x-1/2 flex-col items-center justify-center gap-12 px-10 md:top-[calc(50%-103.5px)] md:px-20">
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 md:gap-2.75",
            chromeClass,
          )}
        >
          <p className="text-muted-foreground text-center text-sm font-medium tracking-normal md:hidden">
            Good morning, Victor!
          </p>
          <h1 className="text-foreground font-heading md:leading-tighter w-full max-w-xs text-center text-[27px] leading-tight tracking-tight md:max-w-lg md:text-3xl lg:text-4xl font-semibold">
            What&apos;s on your mind?
          </h1>
        </div>

        <div className="hidden w-full max-w-2xl flex-col gap-6 md:flex">
          <ChatInput {...chatInputProps} />
          {!suppressChrome ? (
            <NewChatSuggestions
              key={`d-${replay}`}
              onSelect={handleSubmit}
              placement="bottom"
            />
          ) : null}
        </div>
      </div>

      <div className="mt-auto flex w-full max-w-3xl flex-col items-center gap-5 pb-5 text-center md:hidden">
        {!suppressChrome ? (
          <NewChatSuggestions
            key={`m-${replay}`}
            onSelect={handleSubmit}
            placement="top"
          />
        ) : null}
        <ChatInput {...chatInputProps} />
      </div>
    </motion.div>
  );
}
