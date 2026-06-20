"use client";

import { usePathname } from "next/navigation";
import { Message01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { NavChatItem } from "@/components/shell/nav-chat-item";
import {
  useIsLoggedIn,
  useSidebarConversations,
} from "@/components/shell/use-sidebar-conversations";
import { conversationDisplayTitle } from "@/lib/conversation-title";
import { debugLog } from "@/lib/debug";
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

export function NavChats() {
  const pathname = usePathname();
  const isLoggedIn = useIsLoggedIn();
  const { isMobile, setOpenMobile } = useSidebar();
  const { conversations, isLoading } = useSidebarConversations();
  const recentConversations = conversations.filter(
    (conversation) => !conversation.is_favorited,
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
      recentConversations.map((conversation) => ({
        id: conversation.id,
        title: conversationDisplayTitle(conversation.title),
      })),
    );
  }, [recentConversations]);

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
              {recentConversations.length === 0 ? (
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
                recentConversations.map((conversation) => {
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
