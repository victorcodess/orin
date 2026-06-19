"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Message01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { NavChatItem } from "@/components/shell/nav-chat-item";
import type { ConversationRow } from "@/lib/ai/conversations";
import {
  clearConversationsCache,
  CONVERSATIONS_CHANGED_EVENT,
  type ConversationsChangedDetail,
  getCachedConversations,
  getCachedConversationsUserId,
  removeCachedConversation,
  setCachedConversations,
  updateCachedConversationTitle,
} from "@/lib/conversations-cache";
import { conversationDisplayTitle } from "@/lib/conversation-title";
import { debugLog } from "@/lib/debug";
import { createClient } from "@/lib/supabase/client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const MotionSidebarMenuItem = motion.create(SidebarMenuItem);

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 0 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.05, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

function useIsLoggedIn() {
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

export function NavChats() {
  const pathname = usePathname();
  const isLoggedIn = useIsLoggedIn();
  const { isMobile, setOpenMobile } = useSidebar();
  const [conversations, setConversations] = useState<ConversationRow[]>(
    () => getCachedConversations() ?? []
  );
  const [isLoading, setIsLoading] = useState(
    () => getCachedConversations() === null
  );
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  useEffect(() => {
    debugLog(
      "sidebar",
      "rendering conversations",
      conversations.map((conversation) => ({
        id: conversation.id,
        title: conversationDisplayTitle(conversation.title),
      }))
    );
  }, [conversations]);

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
          detail.title ?? null
        );
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === detail.conversationId
              ? {
                  ...conversation,
                  title: detail.title ?? null,
                  updated_at: new Date().toISOString(),
                }
              : conversation
          )
        );
        return;
      }

      if (detail?.type === "delete" && detail.conversationId) {
        removeCachedConversation(detail.conversationId);
        setConversations((current) =>
          current.filter(
            (conversation) => conversation.id !== detail.conversationId
          )
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

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent</SidebarGroupLabel>
      <AnimatePresence mode="wait" initial={false}>
        {isLoading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <SidebarMenu>
              {Array.from({ length: 5 }, (_, index) => (
                <SidebarMenuItem key={index}>
                  <Skeleton className="bg-sidebar-accent/60 h-10 max-w-full animate-pulse rounded-full" />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </motion.div>
        ) : (
          <motion.div
            key="chats"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            <SidebarMenu>
              {conversations.length === 0 ? (
                <MotionSidebarMenuItem variants={itemVariants}>
                  <SidebarMenuButton disabled className="text-muted-foreground">
                    <HugeiconsIcon
                      icon={Message01Icon}
                      strokeWidth={2}
                      className="size-4 shrink-0"
                    />
                    <span>No chats yet</span>
                  </SidebarMenuButton>
                </MotionSidebarMenuItem>
              ) : (
                conversations.map((conversation) => {
                  const href = `/c/${conversation.id}`;
                  const isActive = pathname === href;

                  return (
                    <MotionSidebarMenuItem
                      key={conversation.id}
                      variants={itemVariants}
                    >
                      <NavChatItem
                        conversation={conversation}
                        isActive={isActive}
                        isEditing={editingConversationId === conversation.id}
                        isLoggedIn={isLoggedIn}
                        onStartEdit={setEditingConversationId}
                        onFinishEdit={() => setEditingConversationId(null)}
                        onNavigate={closeMobileSidebar}
                      />
                    </MotionSidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </motion.div>
        )}
      </AnimatePresence>
    </SidebarGroup>
  );
}
