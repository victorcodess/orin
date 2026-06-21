import type { ConversationRow } from "@/lib/ai/conversations";

const pending = new Map<string, Promise<ConversationRow> | null>();
const listeners = new Set<() => void>();

function notifyPendingCreates() {
  listeners.forEach((listener) => listener());
}

export function subscribePendingCreates(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPendingCreateSnapshot() {
  return Array.from(pending.keys()).join(",");
}

export function isConversationCreatePending(conversationId: string): boolean {
  return pending.has(conversationId);
}

export function markConversationCreatePending(conversationId: string) {
  if (pending.has(conversationId)) {
    return;
  }

  pending.set(conversationId, null);
  notifyPendingCreates();
}

async function createConversationRequest(
  conversationId: string,
  message: string
): Promise<ConversationRow> {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ id: conversationId, message: message.trim() }),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "Failed to create chat");
  }

  return (await response.json()) as ConversationRow;
}

export async function ensureConversationCreated(
  conversationId: string,
  message: string
): Promise<ConversationRow> {
  const inFlight = pending.get(conversationId);
  if (inFlight) {
    return inFlight;
  }

  const promise = createConversationRequest(conversationId, message).finally(
    () => {
      if (pending.get(conversationId) === promise) {
        pending.delete(conversationId);
        notifyPendingCreates();
      }
    }
  );

  pending.set(conversationId, promise);
  notifyPendingCreates();
  return promise;
}
