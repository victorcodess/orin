"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ChatOptionsMenuContent } from "@/components/chat/chat-options-menu";
import { DeleteConversationDialog } from "@/components/chat/delete-conversation-dialog";
import {
  broadcastConversationTitleChange,
  conversationDisplayTitle,
  normalizeConversationTitleInput,
  patchConversationTitle,
} from "@/lib/conversation-title";
import { toggleConversationFavorite } from "@/lib/conversation-favorite";
import {
  useConversation,
  useConversationsStore,
} from "@/lib/stores/conversations-store";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/nexus-ui/toaster";
import { cn } from "@/lib/utils";

type ChatTitleProps = {
  conversationId: string;
  isLoggedIn: boolean;
};

export function ChatTitle({ conversationId, isLoggedIn }: ChatTitleProps) {
  const router = useRouter();
  const conversation = useConversation(conversationId);
  const isLoading = useConversationsStore((state) => state.isLoading);
  const chatTitle = conversation?.title ?? null;
  const isFavorited = conversation?.is_favorited ?? false;
  const isTitleLoaded = !isLoading || conversation !== undefined;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const pendingRenameFocusRef = useRef(false);

  const displayTitle = conversationDisplayTitle(chatTitle);

  useEffect(() => {
    if (!isLoading && !conversation) {
      void useConversationsStore.getState().refresh();
    }
  }, [conversation, conversationId, isLoading]);

  useEffect(() => {
    setIsEditingTitle(false);
  }, [conversationId]);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(displayTitle);
    }
  }, [displayTitle, isEditingTitle]);

  const applyTitle = useCallback(
    (title: string | null) => {
      setTitleDraft(conversationDisplayTitle(title));
      broadcastConversationTitleChange(conversationId, title);
    },
    [conversationId]
  );

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

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
    setTitleDraft(displayTitle);
  };

  const handleTitleBlur = async () => {
    if (pendingRenameFocusRef.current) {
      return;
    }

    if (!isEditingTitle) {
      return;
    }

    const nextTitle = normalizeConversationTitleInput(titleDraft);
    const currentTitle = chatTitle?.trim() || null;

    if (nextTitle === currentTitle) {
      handleCancelTitleEdit();
      return;
    }

    const previousTitle = chatTitle;
    setIsEditingTitle(false);
    applyTitle(nextTitle);

    try {
      const updatedConversation = await patchConversationTitle(
        conversationId,
        titleDraft
      );
      applyTitle(updatedConversation.title);
    } catch {
      applyTitle(previousTitle);
      toast.error("Couldn't rename chat");
    }
  };

  const handleRename = () => {
    pendingRenameFocusRef.current = true;
    setTitleDraft(displayTitle);
    setIsEditingTitle(true);
  };

  const handleRenameMenuClose = (event: Event) => {
    if (!pendingRenameFocusRef.current) {
      return;
    }

    event.preventDefault();
    pendingRenameFocusRef.current = false;
    focusTitleInput();
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleFavorite = () => {
    toggleConversationFavorite(conversationId);
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
            onBlur={handleTitleBlur}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                handleCancelTitleEdit();
                event.currentTarget.blur();
              }

              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            aria-label="Chat title"
            className={cn(
              "focus-visible:ring-ring/50 field-sizing-content h-8 max-w-80 min-w-0 rounded-full border-none bg-transparent px-2.5 text-sm font-medium shadow-none transition-colors focus-visible:ring-[3px] md:text-sm dark:bg-transparent animate-in fade-in-0 cursor-text",
              !isEditingTitle &&
                isLoggedIn &&
                "hover:bg-accent hover:dark:bg-muted cursor-text truncate",
              !isEditingTitle && !isLoggedIn && "cursor-text truncate"
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
              onFavorite={handleFavorite}
              onDelete={handleDelete}
              onCloseAutoFocus={handleRenameMenuClose}
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
