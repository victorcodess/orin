"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Message01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import type { ConversationRow } from "@/lib/ai/conversations";
import {
  clearConversationsCache,
  getCachedConversations,
  getCachedConversationsUserId,
  setCachedConversations,
} from "@/lib/conversations-cache";
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
    // transition: {
    //   staggerChildren: 0.025,
    //   delayChildren: 0.02,
    // },
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

function conversationLabel(conversation: ConversationRow) {
  return conversation.title?.trim() || "Untitled chat";
}

export function NavChats() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [conversations, setConversations] = useState<ConversationRow[]>(
    () => getCachedConversations() ?? []
  );
  const [isLoading, setIsLoading] = useState(
    () => getCachedConversations() === null
  );

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
        title: conversationLabel(conversation),
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

    const handleChange = () => {
      void loadConversations(activeUserId ?? null);
    };

    window.addEventListener("orin:conversations-changed", handleChange);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("orin:conversations-changed", handleChange);
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
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={href} onClick={closeMobileSidebar}>
                          {/* <HugeiconsIcon
                            icon={Message01Icon}
                            strokeWidth={2}
                            className="size-4 shrink-0"
                          /> */}
                          <span className="truncate">
                            {conversationLabel(conversation)}
                          </span>
                        </Link>
                      </SidebarMenuButton>
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
