"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { ChatLoading } from "@/components/chat/chat-loading";
import { ChatView } from "@/components/chat/chat-view";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";
import { useMessagesStore } from "@/lib/stores/messages-store";

type ChatRouteProps = {
  conversationId: string;
  isNew: boolean;
};

export function ChatRoute({ conversationId, isNew }: ChatRouteProps) {
  const router = useRouter();
  const cached = useMessagesStore((state) => state.cache[conversationId]);
  const fetchConversation = useMessagesStore((state) => state.fetch);
  const entryCached = useRef(false);
  const prevConversationId = useRef<string | null>(null);

  if (prevConversationId.current !== conversationId) {
    prevConversationId.current = conversationId;
    entryCached.current =
      useMessagesStore.getState().cache[conversationId] !== undefined;
  }

  const fadeIn = !isNew && !entryCached.current;

  useEffect(() => {
    if (isNew) {
      return;
    }

    void fetchConversation(conversationId).then((data) => {
      if (!data) {
        router.replace("/new");
      }
    });
  }, [conversationId, fetchConversation, isNew, router]);

  if (isNew) {
    return (
      <ChatView
        key={conversationId}
        fadeIn={false}
        conversationId={conversationId}
        assistant={DEFAULT_ASSISTANT}
        initialMessages={[]}
      />
    );
  }

  if (!cached) {
    return <ChatLoading />;
  }

  return (
    <ChatView
      key={conversationId}
      fadeIn={fadeIn}
      conversationId={conversationId}
      assistant={cached.assistant}
      initialMessages={cached.messages}
    />
  );
}
