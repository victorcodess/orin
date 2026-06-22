"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { ChatOptionsMenuContent } from "@/components/chat/chat-options-menu";
import { DeleteConversationDialog } from "@/components/chat/delete-conversation-dialog";
import type { SidebarConversation } from "@/lib/conversations/sidebar-conversation";
import { conversationDisplayTitle } from "@/lib/conversation-title";
import { toggleConversationFavorite } from "@/lib/conversation-favorite";
import { useConversationTitleEdit } from "@/lib/hooks/use-conversation-title-edit";
import { useMessagesStore } from "@/lib/stores/messages-store";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarMenuAction, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavChatItemProps = {
  conversation: SidebarConversation;
  isActive: boolean;
  isEditing: boolean;
  isLoggedIn: boolean;
  onStartEdit: (conversationId: string) => void;
  onFinishEdit: () => void;
  onNavigate: () => void;
};

export function NavChatItem({
  conversation,
  isActive,
  isEditing,
  isLoggedIn,
  onStartEdit,
  onFinishEdit,
  onNavigate,
}: NavChatItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const href = `/c/${conversation.id}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    titleDraft,
    setTitleDraft,
    handleBlur,
    handleKeyDown,
    startRenameFromMenu,
    handleRenameMenuClose,
  } = useConversationTitleEdit({
    conversationId: conversation.id,
    title: conversation.title,
    isEditing,
    onFinishEdit,
  });

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isEditing]);

  const handleRename = () => {
    startRenameFromMenu();
    onStartEdit(conversation.id);
  };

  const handleRenameMenuCloseWithFocus = (event: Event) => {
    handleRenameMenuClose(event, () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={titleDraft}
        onChange={(event) => setTitleDraft(event.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label="Chat title"
        className={cn(
          "focus-visible:ring-ring/50 h-10 w-full rounded-full border-none bg-sidebar-accent px-4 text-sm font-medium shadow-none focus-visible:ring-2"
        )}
      />
    );
  }

  return (
    <>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="group-hover/menu-item:bg-sidebar-accent/60 group-hover/menu-item:text-sidebar-accent-foreground group-has-data-[state=open]/menu-item:bg-sidebar-accent/60 group-has-data-[state=open]/menu-item:text-sidebar-accent-foreground"
      >
        <Link
          href={href}
          onClick={onNavigate}
          onMouseEnter={() => useMessagesStore.getState().prefetch(conversation.id)}
          onFocus={() => useMessagesStore.getState().prefetch(conversation.id)}
        >
          <span className="truncate">
            {conversationDisplayTitle(conversation.title)}
          </span>
        </Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            showOnHover
            aria-label="Chat options"
            onClick={(event) => event.stopPropagation()}
            className="top-1/2! -translate-y-1/2 size-7.5 rounded-full right-1.5 hover:bg-input/60 dark:hover:bg-input data-[state=open]:bg-input after:absolute after:-inset-1.75 after:content-[''] after:rounded-full md:after:block"
          >
            <HugeiconsIcon
              icon={MoreVerticalIcon}
              strokeWidth={2}
              className="size-4 shrink-0"
            />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <ChatOptionsMenuContent
          isLoggedIn={isLoggedIn}
          isFavorited={conversation.is_favorited}
          onRename={handleRename}
          onFavorite={() => toggleConversationFavorite(conversation.id)}
          onDelete={() => setIsDeleteDialogOpen(true)}
          onCloseAutoFocus={handleRenameMenuCloseWithFocus}
        />
      </DropdownMenu>
      <DeleteConversationDialog
        conversationId={conversation.id}
        chatTitle={conversation.title}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDeleted={() => {
          if (pathname === href) {
            router.push("/new");
          }
        }}
      />
    </>
  );
}
