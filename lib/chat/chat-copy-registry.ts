"use client";

type ChatCopyProvider = () => string;

const providers = new Map<string, ChatCopyProvider>();

export function registerChatCopyProvider(
  conversationId: string,
  provider: ChatCopyProvider | null,
) {
  if (provider) {
    providers.set(conversationId, provider);
    return;
  }

  providers.delete(conversationId);
}

export function getChatCopyText(conversationId: string) {
  return providers.get(conversationId)?.() ?? null;
}

export async function copyChatToClipboard(conversationId: string) {
  const text = getChatCopyText(conversationId);

  if (!text) {
    return { ok: false as const, reason: "unavailable" as const };
  }

  if (!text.trim() || text.endsWith("(empty thread)")) {
    return { ok: false as const, reason: "empty" as const };
  }

  await navigator.clipboard.writeText(text);
  return { ok: true as const, text };
}
