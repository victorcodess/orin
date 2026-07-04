"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { useShallow } from "zustand/react/shallow";

import {
  ChatMessageList,
  PENDING_ASSISTANT_ID,
} from "@/components/chat/message-list";
import {
  getComposerInput,
  useComposerStore,
} from "@/lib/stores/composer-store";
import { invalidateConversations, removeConversationOptimistic } from "@/lib/stores/conversations-store";
import {
  fetchConversationData,
  setConversationData,
  removeConversationData,
} from "@/lib/stores/messages-store";
import { toast } from "@/components/nexus-ui/toaster";
import {
  Thread,
  ThreadContent,
  ThreadScrollToBottom,
} from "@/components/nexus-ui/thread";
import { isKeyboardShortcutsDialogOpen } from "@/lib/ui/keyboard-shortcuts";
import { chatFetch } from "@/lib/ai/chat-fetch";
import { getChatErrorMessage } from "@/lib/errors";
import { isFetchError } from "@/lib/quotas/client-errors";
import { toastQuotaError } from "@/lib/quotas/toast";
import { registerChatCopyProvider } from "@/lib/chat/chat-copy-registry";
import { formatChatForCopy } from "@/lib/chat/format-chat-for-copy";
import {
  isAssistantReplyComplete,
  textFromUIMessage,
} from "@/lib/ai/message-utils";
import type { MessageRow } from "@/lib/ai/message-utils";
import { useReadAloud } from "@/lib/hooks/use-read-aloud";
import { takePendingFirstMessage } from "@/lib/conversations/pending-first-message";
import {
  useIsVoiceCallActive,
  useVoiceCallStore,
} from "@/lib/stores/voice-call-store";
import {
  EMPTY_VOICE_LIVE_MESSAGES,
  useVoiceLiveMessagesStore,
  voiceLiveMessagesToUi,
} from "@/lib/stores/voice-live-messages-store";
import { ORIN_NAME, type AssistantConfig } from "@/lib/orin/defaults";

const EASE = [0.25, 0.1, 0.25, 1] as const;

function focusComposerInput() {
  requestAnimationFrame(() => {
    const input = document.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label="Message input"]'
    );

    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  });
}

function toastChatError(error: Error) {
  if (isFetchError(error) && (error.code || error.action)) {
    toastQuotaError(error);
    return;
  }

  const message = getChatErrorMessage(error);

  if (message.includes("OPENAI_API_KEY")) {
    toast.error("OpenAI API key not configured", {
      description:
        "Add OPENAI_API_KEY to .env.local and restart the dev server.",
      duration: 8000,
    });
    return;
  }

  if (message === "Forbidden") {
    toast.error("Session expired", {
      description: "Start a new chat from the home page.",
      action: {
        label: "New chat",
        onClick: () => {
          window.location.href = "/new";
        },
      },
      duration: 8000,
    });
    return;
  }

  if (message === "Conversation not found") {
    toast.error("Conversation not found", {
      description: "This chat may have been deleted.",
      action: {
        label: "New chat",
        onClick: () => {
          window.location.href = "/new";
        },
      },
    });
    return;
  }

  toast.error("Couldn't reach Orin", {
    description: message,
    duration: 6000,
  });
}

type ChatViewProps = {
  conversationId: string;
  assistant: AssistantConfig;
  initialMessages: UIMessage[];
  initialMessageSources?: Record<string, MessageRow["source"]>;
  fadeIn?: boolean;
};

// Jump to the bottom instantly only when a conversation first becomes active
// (mount / chat switch). New messages are intentionally NOT pinned here so that
// StickToBottom's smooth resize scroll can slide the just-sent user message to
// the top as the min-height assistant box expands, then track the stream.
function PinThreadBottom({
  active,
  conversationId,
}: {
  active: boolean;
  conversationId: string;
}) {
  const { scrollRef } = useStickToBottomContext();

  useLayoutEffect(() => {
    if (!active) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active, conversationId, scrollRef]);

  return null;
}

export function ChatView({
  conversationId,
  assistant,
  initialMessages,
  initialMessageSources = {},
  fadeIn = false,
}: ChatViewProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const shouldFade = fadeIn && !reduceMotion;
  const setInput = useComposerStore((state) => state.setInput);
  const setControls = useComposerStore((state) => state.setControls);
  const sentInitialPrompt = useRef(false);
  const isNewChat = useRef(initialMessages.length === 0);
  const messagesRef = useRef(initialMessages);
  const readAloud = useReadAloud(assistant.voiceId, assistant.voiceSpeed);
  const [messageSources, setMessageSources] = useState(initialMessageSources);
  const messageSourcesRef = useRef(messageSources);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
    setInput("");
  }, [setInput]);
  const onCancelEditing = useEffectEvent(() => {
    cancelEditing();
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { conversationId },
        fetch: chatFetch,
      }),
    [conversationId]
  );

  const {
    messages,
    sendMessage,
    regenerate,
    status,
    stop,
    clearError,
    setMessages,
  } = useChat({
    transport,
    messages: initialMessages,
    generateId: () => crypto.randomUUID(),
    onError: (chatError) => {
      console.error("[orin:chat-view] useChat error", chatError);
      setMessages((current) =>
        current.filter(
          (message) =>
            message.role !== "assistant" ||
            textFromUIMessage(message).trim().length > 0
        )
      );
      toastChatError(chatError);
      clearError();

      if (isNewChat.current) {
        removeConversationOptimistic(conversationId);
        removeConversationData(conversationId);
        router.push("/new");
      }
    },
    onFinish: () => {
      isNewChat.current = false;
      // Invalidate the sidebar so the new title / new conversation appears.
      invalidateConversations();
      const visible = messagesRef.current.filter(
        (message) => message.role !== "system"
      );
      if (visible.length > 0) {
        setConversationData(conversationId, {
          assistant,
          messages: visible,
          messageSources: messageSourcesRef.current,
        });
      }
    },
  });

  messagesRef.current = messages;
  messageSourcesRef.current = messageSources;

  const voiceCallActive = useIsVoiceCallActive(conversationId);
  const voiceCallStatus = useVoiceCallStore((state) =>
    state.conversationId === conversationId ? state.status : "idle"
  );
  const liveVoiceMessages = useVoiceLiveMessagesStore(
    useShallow((state) =>
      state.conversationId === conversationId
        ? state.messages
        : EMPTY_VOICE_LIVE_MESSAGES
    )
  );
  const liveAgentStreaming = liveVoiceMessages.some(
    (message) => message.streaming
  );

  const prevVoiceCallStatusRef = useRef(voiceCallStatus);
  // After a voice call, the live transcript is swapped for the canonical DB
  // thread (fresh ids). Remember the last id so the message list doesn't
  // re-animate a bubble that was already on screen.
  const [noFadeMessageId, setNoFadeMessageId] = useState<string | null>(null);

  // When a call ends, the canonical thread lives in the DB (the sidecar persists
  // each voice turn). Reload it and replace the ephemeral live transcript so the
  // chat shows the full, correctly-ordered text + voice history.
  useEffect(() => {
    const previous = prevVoiceCallStatusRef.current;
    prevVoiceCallStatusRef.current = voiceCallStatus;

    const endedCall = previous !== "idle" && voiceCallStatus === "idle";

    if (!endedCall) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchConversationData(conversationId);
        if (cancelled || !data?.messages) {
          return;
        }

        setNoFadeMessageId(data.messages.at(-1)?.id ?? null);
        setMessages(data.messages);
        setMessageSources(data.messageSources ?? {});
        setConversationData(conversationId, data);
      } catch (error) {
        console.error("[orin:chat-view] failed to sync voice messages", error);
      } finally {
        if (!cancelled) {
          useVoiceLiveMessagesStore.getState().reset();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assistant, conversationId, setMessages, voiceCallStatus]);

  const isStreaming = status === "streaming" || status === "submitted";
  const isReplyComplete = isAssistantReplyComplete(messages);
  const isComposerBusy = isStreaming && !isReplyComplete;

  useEffect(() => {
    if (!isComposerBusy) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isKeyboardShortcutsDialogOpen()) {
        return;
      }

      event.preventDefault();
      stop();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isComposerBusy, stop]);

  useEffect(() => {
    if (!editingMessageId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isKeyboardShortcutsDialogOpen()) {
        return;
      }

      event.preventDefault();
      onCancelEditing();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingMessageId, onCancelEditing]);

  useLayoutEffect(() => {
    const prompt = takePendingFirstMessage(conversationId);
    if (!prompt || sentInitialPrompt.current) {
      return;
    }

    sentInitialPrompt.current = true;
    sendMessage({ text: prompt });
    window.history.replaceState(null, "", `/c/${conversationId}`);
  }, [conversationId, sendMessage]);

  useEffect(() => {
    const conversationKey = conversationId;

    return () => {
      const visible = messagesRef.current.filter(
        (message) => message.role !== "system"
      );
      if (visible.length === 0) return;

      setConversationData(conversationKey, {
        assistant,
        messages: visible,
        messageSources: messageSourcesRef.current,
      });
    };
  }, [assistant, conversationId]);

  const handleSubmit = useCallback(
    (value?: string) => {
      const trimmed = (value ?? getComposerInput()).trim();
      if (!trimmed || isComposerBusy) {
        return;
      }

      sendMessage(
        editingMessageId
          ? { text: trimmed, messageId: editingMessageId }
          : { text: trimmed }
      );
      setInput("");
      setEditingMessageId(null);
    },
    [editingMessageId, isComposerBusy, sendMessage, setInput]
  );

  const handleRetryMessage = useCallback(
    (messageId: string) => {
      void regenerate({ messageId });
    },
    [regenerate]
  );

  const handleEditMessage = useCallback(
    (messageId: string, text: string) => {
      setEditingMessageId(messageId);
      setInput(text);
      focusComposerInput();
    },
    [setInput]
  );

  const stopReadAloud = readAloud.stop;

  useEffect(() => {
    stopReadAloud();
  }, [conversationId, stopReadAloud]);

  useEffect(() => {
    if (voiceCallActive) {
      stopReadAloud();
    }
  }, [voiceCallActive, stopReadAloud]);

  useLayoutEffect(() => {
    setControls({
      assistant,
      isSubmitting: isComposerBusy,
      handleSubmit,
      onStop: stop,
    });

    return () => setControls(null);
  }, [assistant, handleSubmit, isComposerBusy, setControls, stop]);

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.role !== "system"),
    [messages]
  );
  const liveVoiceUiMessages = useMemo(
    () => voiceLiveMessagesToUi(liveVoiceMessages),
    [liveVoiceMessages]
  );
  const mergedVisibleMessages = useMemo(
    () => [...visibleMessages, ...liveVoiceUiMessages],
    [liveVoiceUiMessages, visibleMessages]
  );
  const lastMessage = mergedVisibleMessages.at(-1);
  // Insert the pending assistant row (the min-height box that scrolls the user
  // message to the top) as soon as the user's turn lands — for text while the
  // composer is busy, and during a live call in the gap after the user speaks
  // but before the agent's reply starts streaming. Without the voice case the
  // box only appears once the agent streams, delaying the scroll-to-top.
  const showPendingAssistant =
    (isComposerBusy || voiceCallStatus === "active") &&
    lastMessage?.role === "user";
  const displayMessages = showPendingAssistant
    ? [
        ...mergedVisibleMessages,
        {
          id: PENDING_ASSISTANT_ID,
          role: "assistant" as const,
          parts: [],
        },
      ]
    : mergedVisibleMessages;

  const displayMessageSources = useMemo(() => {
    const sources = { ...messageSources };

    for (const message of liveVoiceUiMessages) {
      sources[message.id] = "voice";
    }

    return sources;
  }, [liveVoiceUiMessages, messageSources]);

  const copyChatRef = useRef({
    conversationId,
    assistantName: ORIN_NAME,
    messages: mergedVisibleMessages,
    messageSources: displayMessageSources,
    voiceCallStatus,
  });

  copyChatRef.current = {
    conversationId,
    assistantName: ORIN_NAME,
    messages: mergedVisibleMessages,
    messageSources: displayMessageSources,
    voiceCallStatus,
  };

  useEffect(() => {
    registerChatCopyProvider(conversationId, () =>
      formatChatForCopy(copyChatRef.current)
    );

    return () => registerChatCopyProvider(conversationId, null);
  }, [conversationId]);

  return (
    <motion.div
      className="relative flex h-full min-h-0 w-full flex-1 flex-col"
      initial={{ opacity: shouldFade ? 0 : 1 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: shouldFade ? 0.35 : 0,
        ease: EASE,
      }}
    >
      <Thread
        className="h-(--orin-thread-height) min-h-0 [--orin-thread-height:calc(100dvh-133px)] md:[--orin-thread-height:calc(100dvh-156px)]"
        initial="instant"
        style={
          {
            "--orin-thread-content-gap": "24px",
            "--orin-thread-content-bottom-padding": "240px",
            "--orin-min-height-misc": "24px",
          } as CSSProperties
        }
      >
        <ThreadContent className="mx-auto w-full max-w-3xl items-stretch gap-(--orin-thread-content-gap) pt-15 pb-30 md:pt-10 md:pb-(--orin-thread-content-bottom-padding)">
          {mergedVisibleMessages.length === 0 && !isComposerBusy ? (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-24 text-center">
              <p className="text-foreground text-lg font-medium">{ORIN_NAME}</p>
            </div>
          ) : (
            <ChatMessageList
              conversationId={conversationId}
              messages={displayMessages}
              messageSources={displayMessageSources}
              isLoading={isComposerBusy || liveAgentStreaming}
              editingMessageId={editingMessageId}
              readAloud={readAloud}
              onRetry={handleRetryMessage}
              onEdit={handleEditMessage}
              onCancelEdit={cancelEditing}
              noFadeMessageId={noFadeMessageId}
              voiceCallActive={voiceCallActive}
            />
          )}
        </ThreadContent>
        <PinThreadBottom
          active={mergedVisibleMessages.length > 0 || voiceCallActive}
          conversationId={conversationId}
        />
        <ThreadScrollToBottom className="bottom-9 shadow-2xl md:bottom-18" />
      </Thread>
    </motion.div>
  );
}
