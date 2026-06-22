"use client";

import { use } from "react";

import { ChatRoute } from "@/components/chat/chat-route";

type ChatPageClientProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

export function ChatPageClient({ params, searchParams }: ChatPageClientProps) {
  const { id } = use(params);
  const { new: isNew } = use(searchParams);

  return <ChatRoute conversationId={id} isNew={isNew === "1"} />;
}
