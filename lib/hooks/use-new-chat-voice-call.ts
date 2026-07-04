"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

import { NEW_CHAT_EVENT } from "@/components/chat/new-chat-view";
import { titleFromUserMessage } from "@/lib/conversations/title";
import {
  prependConversation,
  renameConversationOptimistic,
} from "@/lib/stores/conversations-store";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";
import { useVoiceLiveMessagesStore } from "@/lib/stores/voice-live-messages-store";

function hasSpeech(text: string) {
  return /[\p{L}\p{N}]/u.test(text.trim());
}

export function useNewChatVoiceCall() {
  const router = useRouter();
  const origin = useVoiceCallStore((state) => state.origin);
  const status = useVoiceCallStore((state) => state.status);
  const conversationId = useVoiceCallStore((state) => state.conversationId);
  const commitNewChatCall = useVoiceCallStore((state) => state.commitNewChatCall);
  const liveMessages = useVoiceLiveMessagesStore((state) => state.messages);
  const routedRef = useRef(false);
  const titledRef = useRef(false);

  const suppressChrome = origin === "new-chat" && status !== "idle";

  useEffect(() => {
    const onNewChat = () => {
      const { origin, status, setDisconnecting } = useVoiceCallStore.getState();
      if (origin === "new-chat" && status !== "idle") {
        setDisconnecting();
      }
      routedRef.current = false;
      titledRef.current = false;
    };

    window.addEventListener(NEW_CHAT_EVENT, onNewChat);
    return () => window.removeEventListener(NEW_CHAT_EVENT, onNewChat);
  }, []);

  useLayoutEffect(() => {
    if (origin !== "new-chat" || !conversationId) {
      return;
    }

    const firstUserMessage = liveMessages.find(
      (message) => message.role === "user" && hasSpeech(message.text),
    );

    if (routedRef.current) {
      if (firstUserMessage && !titledRef.current) {
        titledRef.current = true;
        renameConversationOptimistic(
            conversationId,
            titleFromUserMessage(firstUserMessage.text),
          );
      }
      return;
    }

    // Open the chat thread once the call connects so live voice transcripts
    // render in ChatView instead of the empty new-chat shell.
    if (status !== "active" && !firstUserMessage) {
      return;
    }

    routedRef.current = true;
    const now = new Date().toISOString();

    prependConversation({
      id: conversationId,
      title: firstUserMessage
        ? titleFromUserMessage(firstUserMessage.text)
        : "New chat",
      is_favorited: false,
      created_at: now,
      updated_at: now,
    });

    commitNewChatCall();
    router.push(`/c/${conversationId}?new=1`);
  }, [
    commitNewChatCall,
    conversationId,
    liveMessages,
    origin,
    router,
    status,
  ]);

  return { suppressChrome };
}
