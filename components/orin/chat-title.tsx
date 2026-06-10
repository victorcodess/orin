"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown01Icon,
  Delete02Icon,
  Edit02Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import type { ConversationRow } from "@/lib/ai/conversations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ChatTitleProps = {
  conversationId: string;
  isLoggedIn: boolean;
};

function conversationLabel(title: string | null | undefined) {
  return title?.trim() || "Untitled chat";
}

export function ChatTitle({ conversationId, isLoggedIn }: ChatTitleProps) {
  const [chatTitle, setChatTitle] = useState<string | null>(null);
  const [isTitleLoaded, setIsTitleLoaded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const pendingRenameFocusRef = useRef(false);

  const displayTitle = chatTitle ?? "Untitled chat";

  const loadChatTitle = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations", { cache: "no-store" });
      if (!response.ok) {
        return;
      }

      const conversations = (await response.json()) as ConversationRow[];
      const conversation = conversations.find(
        (item) => item.id === conversationId
      );
      setChatTitle(conversation ? conversationLabel(conversation.title) : null);
    } catch {
    } finally {
      setIsTitleLoaded(true);
    }
  }, [conversationId]);

  useEffect(() => {
    void loadChatTitle();
  }, [loadChatTitle]);

  useEffect(() => {
    const handleChange = () => {
      void loadChatTitle();
    };

    window.addEventListener("orin:conversations-changed", handleChange);
    return () => {
      window.removeEventListener("orin:conversations-changed", handleChange);
    };
  }, [loadChatTitle]);

  useEffect(() => {
    setIsEditingTitle(false);
    setIsTitleLoaded(false);
    setChatTitle(null);
  }, [conversationId]);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(displayTitle);
    }
  }, [displayTitle, isEditingTitle]);

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

  const handleTitleBlur = () => {
    if (pendingRenameFocusRef.current) {
      return;
    }

    handleCancelTitleEdit();
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

    const input = document.getElementById(
      `chat-title-${conversationId}`
    ) as HTMLInputElement | null;

    pendingRenameFocusRef.current = false;
    input?.focus();
    input?.select();
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
            <DropdownMenuContent
              align="start"
              className="min-w-40"
              onCloseAutoFocus={handleRenameMenuClose}
            >
              <DropdownMenuItem disabled={!isLoggedIn} onSelect={handleRename}>
                <HugeiconsIcon
                  icon={Edit02Icon}
                  strokeWidth={2}
                  className="size-4 shrink-0"
                />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isLoggedIn}>
                <HugeiconsIcon
                  icon={FavouriteIcon}
                  strokeWidth={2}
                  className="size-4 shrink-0"
                />
                Favorite
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" disabled={!isLoggedIn}>
                <HugeiconsIcon
                  icon={Delete02Icon}
                  strokeWidth={2}
                  className="size-4 shrink-0"
                />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
