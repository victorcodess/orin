"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ChatOptionsMenuContent } from "@/components/chat/chat-options-menu";
import { DeleteConversationDialog } from "@/components/chat/delete-conversation-dialog";
import { toggleConversationFavorite } from "@/lib/conversation-favorite";
import { useConversationTitleEdit } from "@/lib/hooks/use-conversation-title-edit";
import {
  useConversation,
  useConversationsStore,
} from "@/lib/stores/conversations-store";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ChatTitleProps = {
  conversationId: string;
  isLoggedIn: boolean;
};

export function ChatTitle({ conversationId, isLoggedIn }: ChatTitleProps) {
  const router = useRouter();
  const conversation = useConversation(conversationId);
  const isLoading = useConversationsStore((state) => state.isLoading);
  const isDeleted = useConversationsStore((state) =>
    state.deletedConversationIds.has(conversationId)
  );
  const chatTitle = conversation?.title ?? null;
  const isFavorited = conversation?.is_favorited ?? false;
  const isTitleLoaded = !isLoading || conversation !== undefined;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    titleDraft,
    setTitleDraft,
    displayTitle,
    handleBlur,
    handleKeyDown,
    startRenameFromMenu,
    handleRenameMenuClose,
  } = useConversationTitleEdit({
    conversationId,
    title: chatTitle,
    isEditing: isEditingTitle,
    onFinishEdit: () => setIsEditingTitle(false),
  });

  useEffect(() => {
    if (!isLoading && !conversation && !isDeleted) {
      void useConversationsStore.getState().refresh({ silent: true });
    }
  }, [conversation, conversationId, isDeleted, isLoading]);

  useEffect(() => {
    setIsEditingTitle(false);
  }, [conversationId]);

  const focusTitleInput = useCallback(() => {
    const input = document.getElementById(
      `chat-title-${conversationId}`
    ) as HTMLInputElement | null;

    input?.focus();
    input?.select();
  }, [conversationId]);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const input = event.currentTarget;

    if (!isLoggedIn) {
      input.blur();
      return;
    }

    if (!isEditingTitle) {
      setTitleDraft(displayTitle);
      setIsEditingTitle(true);
    }

    requestAnimationFrame(() => {
      input.select();
    });
  };

  const handleRename = () => {
    startRenameFromMenu();
    setIsEditingTitle(true);
  };

  const handleRenameMenuCloseWithFocus = (event: Event) => {
    handleRenameMenuClose(event, focusTitleInput);
  };

  return (
    <div className="flex items-center -space-x-1.5">
      {!isTitleLoaded ? (
        <Skeleton className="h-8 w-40 bg-accent/60 dark:bg-muted/60 animate-in fade-in-0" aria-hidden />
      ) : (
        <>
          <Input
            id={`chat-title-${conversationId}`}
            readOnly={!isEditingTitle}
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            aria-label="Chat title"
            className={cn(
              "field-sizing-content h-8 max-w-80 min-w-0 rounded-full border-none px-2.5 text-sm font-medium shadow-none outline-none md:text-sm animate-in fade-in-0 cursor-text",
              isEditingTitle
                ? "focus-visible:ring-ring/50 bg-accent dark:bg-muted transition-[color,box-shadow] focus-visible:ring-2"
                : cn(
                    "bg-transparent dark:bg-transparent transition-colors focus-visible:ring-0",
                    isLoggedIn &&
                      "hover:bg-accent hover:dark:bg-muted cursor-text truncate",
                    !isLoggedIn && "cursor-text truncate"
                  )
            )}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!isTitleLoaded}
                className={cn(
                  "hover:bg-accent hover:dark:bg-muted shrink-0 transition-opacity",
                  isEditingTitle && "pointer-events-none opacity-0"
                )}
                aria-label="Chat options"
                aria-hidden={isEditingTitle}
                tabIndex={isEditingTitle ? -1 : 0}
              >
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  strokeWidth={2}
                  className="size-4 shrink-0"
                />
              </Button>
            </DropdownMenuTrigger>
            <ChatOptionsMenuContent
              isLoggedIn={isLoggedIn}
              isFavorited={isFavorited}
              onRename={handleRename}
              onFavorite={() => toggleConversationFavorite(conversationId)}
              onDelete={() => setIsDeleteDialogOpen(true)}
              onCloseAutoFocus={handleRenameMenuCloseWithFocus}
            />
          </DropdownMenu>
          <DeleteConversationDialog
            conversationId={conversationId}
            chatTitle={chatTitle}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onDeleted={() => router.push("/new")}
          />
        </>
      )}
    </div>
  );
}
