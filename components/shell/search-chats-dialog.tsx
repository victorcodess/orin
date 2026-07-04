"use client";

import {
  Add01Icon,
  FavouriteIcon,
  Message01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { signalNewChat } from "@/components/chat/new-chat-view";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/components/ui/sidebar";
import { useKeyboardShortcutLabels } from "@/lib/hooks/use-keyboard-shortcut-labels";
import {
  hasPrimaryModifier,
  isKeyboardShortcutsDialogOpen,
  isPlainEscape,
  isSettingsPanelOpen,
  enterLabel,
} from "@/lib/keyboard-shortcuts";
import {
  buildConversationSearch,
  formatConversationDate,
  useSearchChatsStore,
  type SearchableConversation,
} from "@/lib/search-chats";
import { useIsLoggedIn } from "@/lib/stores/auth-store";
import { useSidebarConversations } from "@/lib/stores/conversations-store";

const SKELETON_COUNT = 5;

const searchItemClassName =
  "cursor-pointer gap-3 px-4 py-2.75 transition-none";

const searchCommandClassName =
  "rounded-none **:[[cmdk-group-heading]]:px-3 [&_[cmdk-input]:focus-visible]:ring-0 [&_[cmdk-item]:focus-visible]:ring-0 [&_[cmdk-item]:focus-visible]:outline-none [&_[cmdk-list]:focus-visible]:ring-0 [&_[cmdk-list]:focus-visible]:outline-none [&_[cmdk-root]:focus-visible]:ring-0";

function SearchChatsSkeletons() {
  return (
    <div className="flex flex-col gap-1.5 px-1 py-1">
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <Skeleton
          key={index}
          className="bg-muted/60 h-10 w-full animate-pulse rounded-full"
        />
      ))}
    </div>
  );
}

function SearchChatsEmptyState({
  variant,
  query,
}: {
  variant: "empty" | "no-results";
  query?: string;
}) {
  const isNoResults = variant === "no-results";

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 px-6 py-10 text-center"
    >
      <div className="bg-muted/50 flex size-10 items-center justify-center rounded-full">
        <HugeiconsIcon
          icon={isNoResults ? Search01Icon : Message01Icon}
          strokeWidth={2}
          className="text-muted-foreground size-4.5"
        />
      </div>
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-foreground text-sm font-medium">
          {isNoResults ? "No chats found" : "No chats yet"}
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {isNoResults
            ? query
              ? `Nothing matched “${query}”. Try another title or keyword.`
              : "Try a different search term."
            : "Your conversations will appear here. Start one with New chat above."}
        </p>
      </div>
    </div>
  );
}

function SearchChatItem({
  conversation,
  onSelect,
}: {
  conversation: SearchableConversation;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      className={`group/search-item ${searchItemClassName}`}
      value={conversation.id}
      keywords={[conversation.displayTitle]}
      onSelect={onSelect}
    >
      <HugeiconsIcon
        icon={conversation.is_favorited ? FavouriteIcon : Message01Icon}
        strokeWidth={2}
        className="size-4 shrink-0"
      />
      <span className="min-w-0 flex-1 truncate">{conversation.displayTitle}</span>
      <span className="text-muted-foreground/50 shrink-0 text-xs tabular-nums group-hover/search-item:hidden group-data-[selected=true]/search-item:hidden">
        {formatConversationDate(conversation.updated_at)}
      </span>
      <Kbd className="pointer-events-none hidden shrink-0 pt-0.75 group-hover/search-item:inline-flex group-data-[selected=true]/search-item:inline-flex">
        {enterLabel()}
      </Kbd>
    </CommandItem>
  );
}

export function SearchChatsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const { modifier, shift } = useKeyboardShortcutLabels();
  const isLoggedIn = useIsLoggedIn();
  const { conversations, isLoading } = useSidebarConversations();
  const [query, setQuery] = useState("");

  const searchConversations = useMemo(
    () => buildConversationSearch(conversations),
    [conversations],
  );

  const filteredConversations = useMemo(
    () => searchConversations(query),
    [query, searchConversations],
  );

  const trimmedQuery = query.trim();
  const showChatSkeletons = isLoggedIn && isLoading;
  const showEmptyState =
    isLoggedIn && !showChatSkeletons && filteredConversations.length === 0;

  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const closeAndNavigate = (href: string) => {
    onOpenChange(false);
    if (isMobile) {
      setOpenMobile(false);
    }
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-lg/1 ring-1 ring-foreground/5 outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/5 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Search chats</DialogTitle>
        <DialogDescription className="sr-only">
          Search your chat history or start a new chat.
        </DialogDescription>
        <Command shouldFilter={false} loop className={searchCommandClassName}>
          <CommandInput
            placeholder="Search chats..."
            value={query}
            onValueChange={setQuery}
            wrapperClassName="h-12 gap-3 px-4 pr-11 pl-6.5"
            className="h-12 focus-visible:ring-0"
          />
          <CommandList className="max-h-[min(420px,50vh)] scroll-py-2 px-1 pb-1 pt-2">
            <CommandGroup heading="Quick actions" className="p-2">
              <CommandItem
                className={searchItemClassName}
                value="new-chat"
                onSelect={() => {
                  signalNewChat();
                  closeAndNavigate("/new");
                }}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  className="size-4 shrink-0"
                />
                <span>New chat</span>
                <KbdGroup className="ml-auto shrink-0">
                  <Kbd>{shift}</Kbd>
                  <Kbd>{modifier}</Kbd>
                  <Kbd>O</Kbd>
                </KbdGroup>
              </CommandItem>
            </CommandGroup>

            {isLoggedIn ? (
              <CommandGroup heading="Recent chats" className="p-2">
                {showChatSkeletons ? (
                  <SearchChatsSkeletons />
                ) : showEmptyState ? (
                  <SearchChatsEmptyState
                    variant={trimmedQuery ? "no-results" : "empty"}
                    query={trimmedQuery}
                  />
                ) : (
                  filteredConversations.map((conversation) => (
                    <SearchChatItem
                      key={conversation.id}
                      conversation={conversation}
                      onSelect={() =>
                        closeAndNavigate(`/c/${conversation.id}`)
                      }
                    />
                  ))
                )}
              </CommandGroup>
            ) : (
              <div className="border-t border-border/30 px-4 py-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Sign in to search your chat history
                </p>
              </div>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function AppSearchChats() {
  const open = useSearchChatsStore((state) => state.open);
  const setOpen = useSearchChatsStore((state) => state.setOpen);
  const toggle = useSearchChatsStore((state) => state.toggle);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSettingsPanelOpen() || isKeyboardShortcutsDialogOpen()) {
        return;
      }

      if (open && isPlainEscape(event)) {
        return;
      }

      if (
        hasPrimaryModifier(event) &&
        event.key.toLowerCase() === "k" &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open, toggle]);

  return <SearchChatsDialog open={open} onOpenChange={setOpen} />;
}
