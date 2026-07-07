"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

import { NEW_CHAT_EVENT } from "@/components/chat/new-chat-view";
import {
  patchConversationTitle,
  titleFromUserMessage,
} from "@/lib/conversations/title";
import {
  prependConversation,
  renameConversationOptimistic,
} from "@/lib/stores/conversations-store";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";
import { useVoiceLiveMessagesStore } from "@/lib/stores/voice-live-messages-store";

export function useNewChatVoiceCallRouting() {
  const router = useRouter();
  const origin = useVoiceCallStore((state) => state.origin);
  const conversationId = useVoiceCallStore((state) => state.conversationId);
  const commitNewChatCall = useVoiceCallStore((state) => state.commitNewChatCall);
  const liveMessages = useVoiceLiveMessagesStore((state) => state.messages);
  const routedRef = useRef(false);

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
    if (origin !== "new-chat" || !conversationId) {
      return;
    }

    const firstUserMessage = liveMessages.find(
      (message) => message.role === "user",
    );

    if (!firstUserMessage) {
      return;
    }

    const title = titleFromUserMessage(firstUserMessage.text);

    if (!routedRef.current) {
      routedRef.current = true;
      const now = new Date().toISOString();

      prependConversation({
        id: conversationId,
        title,
        is_favorited: false,
        created_at: now,
        updated_at: now,
      });

      commitNewChatCall();
      void patchConversationTitle(conversationId, title).catch(() => {});
      router.replace(`/c/${conversationId}?new=1`);
      return;
    }

    renameConversationOptimistic(conversationId, title);
  }, [commitNewChatCall, conversationId, liveMessages, origin, router]);
}
