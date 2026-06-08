import type { ConversationRow } from "@/lib/ai/conversations";

let cachedConversations: ConversationRow[] | null = null;
let cachedPathname: string | null = null;

export function getCachedConversations(pathname: string) {
  if (cachedPathname === pathname && cachedConversations) {
    return cachedConversations;
  }

  return null;
}

export function setCachedConversations(
  pathname: string,
  conversations: ConversationRow[]
) {
  cachedPathname = pathname;
  cachedConversations = conversations;
}

export function clearConversationsCache() {
  cachedPathname = null;
  cachedConversations = null;
}
