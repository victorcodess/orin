"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import {
  getPendingCreateSnapshot,
  isConversationCreatePending,
  subscribePendingCreates,
} from "@/lib/pending-conversation-create";
import { useConversation } from "@/lib/stores/conversations-store";

export function useIsConversationPending(conversationId: string | null) {
  useSyncExternalStore(
    subscribePendingCreates,
    getPendingCreateSnapshot,
    getPendingCreateSnapshot
  );

  const searchParams = useSearchParams();
  const conversation = useConversation(conversationId ?? "");

  if (!conversationId || conversation) {
    return false;
  }

  return (
    isConversationCreatePending(conversationId) ||
    Boolean(searchParams.get("message")?.trim())
  );
}

export function usePendingConversationIdFromRoute(): string | null {
  const pathname = usePathname();
  const match = pathname.match(/^\/c\/([^/]+)$/);
  const conversationId = match?.[1] ?? null;
  const isPending = useIsConversationPending(conversationId);

  return isPending && conversationId ? conversationId : null;
}
