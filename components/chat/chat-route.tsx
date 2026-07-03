"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { ChatLoading } from "@/components/chat/chat-loading";
import { ChatView } from "@/components/chat/chat-view";
import { useAssistantConfig } from "@/lib/stores/assistant-config-store";
import {
  useConversationQuery,
} from "@/lib/stores/messages-store";
import { queryKeys } from "@/lib/query-keys";

type ChatRouteProps = {
  conversationId: string;
  isNew: boolean;
};

export function ChatRoute({ conversationId, isNew }: ChatRouteProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const assistantConfig = useAssistantConfig();

  // Detect whether the data was already in cache before this render so we
  // know whether to fade the conversation in or show it instantly.
  const prevConversationId = useRef<string | null>(null);
  const entryCached = useRef(false);

  if (prevConversationId.current !== conversationId) {
    prevConversationId.current = conversationId;
    entryCached.current =
      queryClient.getQueryData(queryKeys.conversation(conversationId)) !==
      undefined;
  }

  const fadeIn = !isNew && !entryCached.current;

  const { data: conversationData } = useConversationQuery(conversationId, {
    enabled: !isNew,
  });

  // Redirect if the conversation no longer exists (404 from the API).
  useEffect(() => {
    if (conversationData === null) {
      router.replace("/new");
    }
  }, [conversationData, router]);

  if (isNew) {
    return (
      <ChatView
        key={conversationId}
        fadeIn={false}
        conversationId={conversationId}
        assistant={assistantConfig}
        initialMessages={[]}
        initialMessageSources={{}}
      />
    );
  }

  // Show loading skeleton until the conversation data arrives.
  if (!conversationData) {
    return <ChatLoading />;
  }

  return (
    <ChatView
      key={conversationId}
      fadeIn={fadeIn}
      conversationId={conversationId}
      assistant={assistantConfig}
      initialMessages={conversationData.messages}
      initialMessageSources={conversationData.messageSources ?? {}}
    />
  );
}
