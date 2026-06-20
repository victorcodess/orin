"use client";

import { usePathname } from "next/navigation";
import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { NavChatItem } from "@/components/shell/nav-chat-item";
import { useIsLoggedIn } from "@/lib/stores/auth-store";
import { useSidebarConversations } from "@/lib/stores/conversations-store";
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
const FAVORITE_SKELETON_COUNT = 1;

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

export function NavFavorites() {
  const pathname = usePathname();
  const isLoggedIn = useIsLoggedIn();
  const { isMobile, setOpenMobile } = useSidebar();
  const { conversations, isLoading } = useSidebarConversations();
  const favoriteConversations = conversations.filter(
    (conversation) => conversation.is_favorited,
  );
  const [editingConversationId, setEditingConversationId] = useState<
    string | null
  >(null);

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>
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
              {Array.from({ length: FAVORITE_SKELETON_COUNT }, (_, index) => (
                <SidebarMenuItem key={index}>
                  <Skeleton className="bg-sidebar-accent/60 h-10 max-w-full animate-pulse rounded-full" />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </motion.div>
        ) : (
          <motion.div
            key="favorites"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            <SidebarMenu>
              {favoriteConversations.length === 0 ? (
                <MotionSidebarMenuItem variants={itemVariants}>
                  <SidebarMenuButton disabled className="text-muted-foreground">
                    <HugeiconsIcon
                      icon={FavouriteIcon}
                      strokeWidth={2}
                      className="size-4 shrink-0"
                    />
                    <span>No favorites yet</span>
                  </SidebarMenuButton>
                </MotionSidebarMenuItem>
              ) : (
                favoriteConversations.map((conversation) => {
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
