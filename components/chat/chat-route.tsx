"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      conversationId={conversationId}
      assistant={cached.assistant}
      initialMessages={cached.messages}
    />
  );
}
