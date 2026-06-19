"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { ChatOptionsMenuContent } from "@/components/chat/chat-options-menu";
import { DeleteConversationDialog } from "@/components/chat/delete-conversation-dialog";
import type { ConversationRow } from "@/lib/ai/conversations";
import {
  broadcastConversationTitleChange,
  conversationDisplayTitle,
  normalizeConversationTitleInput,
  patchConversationTitle,
} from "@/lib/conversation-title";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarMenuAction, SidebarMenuButton } from "@/components/ui/sidebar";
import { toast } from "@/components/nexus-ui/toaster";
import { cn } from "@/lib/utils";

type NavChatItemProps = {
  conversation: ConversationRow;
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
  const pendingRenameFocusRef = useRef(false);
  const [titleDraft, setTitleDraft] = useState(() =>
    conversationDisplayTitle(conversation.title)
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setTitleDraft(conversationDisplayTitle(conversation.title));
    }
  }, [conversation.title, isEditing]);

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
    pendingRenameFocusRef.current = true;
    setTitleDraft(conversationDisplayTitle(conversation.title));
    onStartEdit(conversation.id);
  };

  const handleRenameMenuClose = (event: Event) => {
    if (!pendingRenameFocusRef.current) {
      return;
    }

    event.preventDefault();
    pendingRenameFocusRef.current = false;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const handleCancelEdit = () => {
    setTitleDraft(conversationDisplayTitle(conversation.title));
    onFinishEdit();
  };

  const handleTitleBlur = async () => {
    if (pendingRenameFocusRef.current) {
      return;
    }

    if (!isEditing) {
      return;
    }

    const nextTitle = normalizeConversationTitleInput(titleDraft);
    const currentTitle = conversation.title?.trim() || null;

    if (nextTitle === currentTitle) {
      handleCancelEdit();
      return;
    }

    const previousTitle = conversation.title;
    broadcastConversationTitleChange(conversation.id, nextTitle);
    onFinishEdit();

    try {
      const updated = await patchConversationTitle(conversation.id, titleDraft);
      broadcastConversationTitleChange(conversation.id, updated.title);
    } catch {
      broadcastConversationTitleChange(conversation.id, previousTitle);
      toast.error("Couldn't rename chat");
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={titleDraft}
        onChange={(event) => setTitleDraft(event.target.value)}
        onBlur={handleTitleBlur}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            handleCancelEdit();
            event.currentTarget.blur();
          }

          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
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
        <Link href={href} onClick={onNavigate}>
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
          onRename={handleRename}
          onDelete={handleDelete}
          onCloseAutoFocus={handleRenameMenuClose}
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
