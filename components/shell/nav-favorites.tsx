"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { NavChatItem } from "@/components/shell/nav-chat-item";
import {
  useIsLoggedIn,
  useSidebarConversations,
} from "@/components/shell/use-sidebar-conversations";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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

  if (isLoading || favoriteConversations.length === 0) {
    return null;
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key="favorites"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <SidebarMenu>
            {favoriteConversations.map((conversation) => {
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
            })}
          </SidebarMenu>
        </motion.div>
      </AnimatePresence>
    </SidebarGroup>
  );
}
