"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

import { NEW_CHAT_EVENT } from "@/components/chat/new-chat-view";
import { titleFromUserMessage } from "@/lib/conversation-title";
import { useConversationsStore } from "@/lib/stores/conversations-store";
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

  const suppressChrome = origin === "new-chat" && status !== "idle";

  useEffect(() => {
    const onNewChat = () => {
      const { origin, status, setDisconnecting } = useVoiceCallStore.getState();
      if (origin === "new-chat" && status !== "idle") {
        setDisconnecting();
      }
      routedRef.current = false;
    };

    window.addEventListener(NEW_CHAT_EVENT, onNewChat);
    return () => window.removeEventListener(NEW_CHAT_EVENT, onNewChat);
  }, []);

  useLayoutEffect(() => {
    if (
      origin !== "new-chat" ||
      !conversationId ||
      routedRef.current
    ) {
      return;
    }

    const firstUserMessage = liveMessages.find(
      (message) => message.role === "user" && hasSpeech(message.text),
    );

    if (!firstUserMessage) {
      return;
    }

    routedRef.current = true;
    const now = new Date().toISOString();

    useConversationsStore.getState().prependConversation({
      id: conversationId,
      title: titleFromUserMessage(firstUserMessage.text),
      is_favorited: false,
      created_at: now,
      updated_at: now,
    });

    commitNewChatCall();
    router.push(`/c/${conversationId}?new=1`);
  }, [commitNewChatCall, conversationId, liveMessages, origin, router]);

  return { suppressChrome };
}
