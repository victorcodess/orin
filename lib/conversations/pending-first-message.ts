const pending = new Map<string, string>();

export function setPendingFirstMessage(conversationId: string, message: string) {
  const trimmed = message.trim();
  if (trimmed) {
    pending.set(conversationId, trimmed);
  }
}

export function takePendingFirstMessage(conversationId: string): string | null {
  const message = pending.get(conversationId) ?? null;
  pending.delete(conversationId);
  return message;
}
