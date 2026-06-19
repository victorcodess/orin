"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ChatOptionsMenuContent } from "@/components/chat/chat-options-menu";
import { DeleteConversationDialog } from "@/components/chat/delete-conversation-dialog";
import type { ConversationRow } from "@/lib/ai/conversations";
import {
  broadcastConversationTitleChange,
  conversationDisplayTitle,
  normalizeConversationTitleInput,
  patchConversationTitle,
} from "@/lib/conversation-title";
import {
  CONVERSATIONS_CHANGED_EVENT,
  type ConversationsChangedDetail,
  getCachedConversations,
} from "@/lib/conversations-cache";
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
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [isTitleLoaded, setIsTitleLoaded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const pendingRenameFocusRef = useRef(false);

  const displayTitle = conversationDisplayTitle(chatTitle);

  const applyTitle = useCallback((title: string | null) => {
    setChatTitle(title);
    setTitleDraft(conversationDisplayTitle(title));
    broadcastConversationTitleChange(conversationId, title);
  }, [conversationId]);

  const loadChatTitle = useCallback(async () => {
    const cachedConversation = getCachedConversations()?.find(
      (item) => item.id === conversationId
    );

    if (cachedConversation) {
      setChatTitle(cachedConversation.title);
      setIsTitleLoaded(true);
      return;
    }

    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const conversations = (await response.json()) as ConversationRow[];
      const conversation = conversations.find(
        (item) => item.id === conversationId
      );
      setChatTitle(conversation?.title ?? null);
    } catch {
    } finally {
      setIsTitleLoaded(true);
    }
  }, [conversationId]);

  useEffect(() => {
    setIsEditingTitle(false);
    setIsTitleLoaded(false);
    setChatTitle(null);
    void loadChatTitle();
  }, [conversationId, loadChatTitle]);

  useEffect(() => {
    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<ConversationsChangedDetail>).detail;

      if (detail?.type === "rename" && detail.conversationId === conversationId) {
        setChatTitle(detail.title ?? null);
        return;
      }

      void loadChatTitle();
    };

    window.addEventListener(CONVERSATIONS_CHANGED_EVENT, handleChange);
    return () => {
      window.removeEventListener(CONVERSATIONS_CHANGED_EVENT, handleChange);
    };
  }, [conversationId, loadChatTitle]);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(displayTitle);
    }
  }, [displayTitle, isEditingTitle]);

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
      const conversation = await patchConversationTitle(
        conversationId,
        titleDraft
      );
      applyTitle(conversation.title);
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
              onRename={handleRename}
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
