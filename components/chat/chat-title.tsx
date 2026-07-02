"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDown01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { ChatOptionsMenuContent } from "@/components/chat/chat-options-menu";
import { DeleteConversationDialog } from "@/components/chat/delete-conversation-dialog";
import { toast } from "@/components/nexus-ui/toaster";
import { copyChatToClipboard } from "@/lib/chat/chat-copy-registry";
import { toggleConversationFavorite } from "@/lib/conversation-favorite";
import { useConversationTitleEdit } from "@/lib/hooks/use-conversation-title-edit";
import { iconSwapMotion } from "@/components/motion/icon-swap";
import {
  useConversation,
  useConversationsStore,
} from "@/lib/stores/conversations-store";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const titleActionButtonClassName =
  "hover:bg-accent hover:dark:bg-muted shrink-0";

function titleActionSlot(
  key: string,
  reduceMotion: boolean | null,
  children: ReactNode
) {
  return (
    <motion.div
      key={key}
      {...iconSwapMotion(reduceMotion)}
      className="flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
}

type ChatTitleProps = {
  conversationId: string;
  isLoggedIn: boolean;
};

export function ChatTitle({ conversationId, isLoggedIn }: ChatTitleProps) {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const fadeInRef = useRef(true);

  if (prevPathRef.current !== pathname) {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    fadeInRef.current = prev === null || !/^\/c\/[^/]+$/.test(prev);
  }

  return (
    <ChatTitleEditor
      key={conversationId}
      conversationId={conversationId}
      isLoggedIn={isLoggedIn}
      fadeIn={fadeInRef.current}
    />
  );
}

function ChatTitleEditor({
  conversationId,
  isLoggedIn,
  fadeIn,
}: ChatTitleProps & { fadeIn: boolean }) {
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
  const reduceMotion = useReducedMotion();

  const {
    titleDraft,
    setTitleDraft,
    displayTitle,
    handleBlur,
    handleKeyDown,
    startRenameFromMenu,
    handleRenameMenuClose,
    isSaving,
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

  const handleCopyChat = () => {
    void copyChatToClipboard(conversationId).then((result) => {
      if (result.ok) {
        toast.success("Chat copied to clipboard");
        return;
      }

      if (result.reason === "empty") {
        toast.error("Nothing to copy yet");
        return;
      }

      toast.error("Chat isn't ready to copy yet");
    });
  };

  return (
    <div className="flex items-center -space-x-1.5">
      {!isTitleLoaded ? (
        <Skeleton
          className={cn(
            "h-9 w-40 bg-accent/60 dark:bg-muted/60",
            fadeIn && "animate-in fade-in-0"
          )}
          aria-hidden
        />
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
              "field-sizing-content h-9 max-w-80 min-w-0 rounded-full border-none px-2.5 text-sm font-medium shadow-none outline-none md:text-sm cursor-text",
              fadeIn && "animate-in fade-in-0",
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

          <div
            className={cn(
              "relative size-9 shrink-0",
              isEditingTitle &&
                !isSaving &&
                "pointer-events-none opacity-0"
            )}
            aria-hidden={isEditingTitle && !isSaving}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSaving
                ? titleActionSlot(
                    "saving",
                    reduceMotion,
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-md"
                      disabled
                      aria-busy
                      aria-label="Saving chat title"
                      className={titleActionButtonClassName}
                    >
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        strokeWidth={2}
                        className="size-4 animate-spin"
                      />
                    </Button>
                  )
                : !isEditingTitle
                  ? titleActionSlot(
                      "menu",
                      reduceMotion,
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-md"
                            disabled={!isTitleLoaded}
                            className={titleActionButtonClassName}
                            aria-label="Chat options"
                          >
                            <HugeiconsIcon
                              icon={ArrowDown01Icon}
                              strokeWidth={2}
                              className="size-4.5 shrink-0"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <ChatOptionsMenuContent
                          isLoggedIn={isLoggedIn}
                          isFavorited={isFavorited}
                          onRename={handleRename}
                          onFavorite={() =>
                            toggleConversationFavorite(conversationId)
                          }
                          onCopyChat={handleCopyChat}
                          onDelete={() => setIsDeleteDialogOpen(true)}
                          onCloseAutoFocus={handleRenameMenuCloseWithFocus}
                        />
                      </DropdownMenu>
                    )
                  : null}
            </AnimatePresence>
          </div>
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
