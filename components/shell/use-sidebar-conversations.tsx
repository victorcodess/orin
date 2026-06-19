"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { ConversationRow } from "@/lib/ai/conversations";
import {
  clearConversationsCache,
  CONVERSATIONS_CHANGED_EVENT,
  type ConversationsChangedDetail,
  getCachedConversations,
  getCachedConversationsUserId,
  removeCachedConversation,
  setCachedConversations,
  updateCachedConversationFavorite,
  updateCachedConversationTitle,
} from "@/lib/conversations-cache";
import { debugLog } from "@/lib/debug";
import { createClient } from "@/lib/supabase/client";

type SidebarConversationsContextValue = {
  conversations: ConversationRow[];
  isLoading: boolean;
};

const SidebarConversationsContext =
  createContext<SidebarConversationsContextValue | null>(null);

function useSidebarConversationsState(): SidebarConversationsContextValue {
  const [conversations, setConversations] = useState<ConversationRow[]>(
    () => getCachedConversations() ?? [],
  );
  const [isLoading, setIsLoading] = useState(
    () => getCachedConversations() === null,
  );

  useEffect(() => {
    let cancelled = false;
    let activeUserId: string | null | undefined = getCachedConversationsUserId();

    async function loadConversations(userId: string | null) {
      try {
        const response = await fetch("/api/conversations", {
          cache: "no-store",
        });
        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setIsLoading(false);
          return;
        }

        const data = (await response.json()) as ConversationRow[];
        debugLog("sidebar", "supabase conversations", data);
        if (!cancelled) {
          setCachedConversations(data, userId);
          setConversations(data);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    async function syncForUser(userId: string | null) {
      if (userId === activeUserId) {
        return;
      }

      activeUserId = userId;
      const cached = getCachedConversations(userId);
      if (cached) {
        setConversations(cached);
        setIsLoading(false);
        return;
      }

      clearConversationsCache();
      setConversations([]);
      setIsLoading(true);
      await loadConversations(userId);
    }

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        void syncForUser(data.user?.id ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        void syncForUser(session?.user?.id ?? null);
      }
    });

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<ConversationsChangedDetail>).detail;

      if (detail?.type === "rename" && detail.conversationId) {
        updateCachedConversationTitle(
          detail.conversationId,
          detail.title ?? null,
        );
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === detail.conversationId
              ? {
                  ...conversation,
                  title: detail.title ?? null,
                  updated_at: new Date().toISOString(),
                }
              : conversation,
          ),
        );
        return;
      }

      if (detail?.type === "favorite" && detail.conversationId) {
        updateCachedConversationFavorite(
          detail.conversationId,
          detail.isFavorited ?? false,
        );
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === detail.conversationId
              ? {
                  ...conversation,
                  is_favorited: detail.isFavorited ?? false,
                  updated_at: new Date().toISOString(),
                }
              : conversation,
          ),
        );
        return;
      }

      if (detail?.type === "delete" && detail.conversationId) {
        removeCachedConversation(detail.conversationId);
        setConversations((current) =>
          current.filter(
            (conversation) => conversation.id !== detail.conversationId,
          ),
        );
        return;
      }

      const cached = getCachedConversations();
      if (cached) {
        setConversations(cached);
      }

      void loadConversations(activeUserId ?? null);
    };

    window.addEventListener(CONVERSATIONS_CHANGED_EVENT, handleChange);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener(CONVERSATIONS_CHANGED_EVENT, handleChange);
    };
  }, []);

  return { conversations, isLoading };
}

export function SidebarConversationsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useSidebarConversationsState();

  return (
    <SidebarConversationsContext.Provider value={value}>
      {children}
    </SidebarConversationsContext.Provider>
  );
}

export function useSidebarConversations() {
  const context = useContext(SidebarConversationsContext);

  if (!context) {
    throw new Error(
      "useSidebarConversations must be used within SidebarConversationsProvider",
    );
  }

  return context;
}

export function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  return isLoggedIn;
}
