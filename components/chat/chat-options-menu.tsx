"use client";

import {
  Copy01Icon,
  Delete02Icon,
  Edit04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { FavoriteHeartIcon } from "@/components/chat/favorite-heart-icon";

import {
  DropdownMenuContent,
  DropdownMenuDeferredItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ChatOptionsMenuContentProps = {
  isLoggedIn: boolean;
  isFavorited?: boolean;
  onRename?: () => void;
  onFavorite?: () => void;
  onCopyChat?: () => void;
  onDelete?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

export function ChatOptionsMenuContent({
  isLoggedIn,
  isFavorited = false,
  onRename,
  onFavorite,
  onCopyChat,
  onDelete,
  onCloseAutoFocus,
}: ChatOptionsMenuContentProps) {
  return (
    <DropdownMenuContent
      align="start"
      className="min-w-40"
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <DropdownMenuItem disabled={!isLoggedIn} onSelect={onRename}>
        <HugeiconsIcon
          icon={Edit04Icon}
          strokeWidth={2}
          className="size-4 shrink-0"
        />
        Rename
      </DropdownMenuItem>
      <DropdownMenuDeferredItem
        disabled={!isLoggedIn}
        onSelect={() => onFavorite?.()}
      >
        <FavoriteHeartIcon filled={isFavorited} />
        {isFavorited ? "Unfavorite" : "Favorite"}
      </DropdownMenuDeferredItem>
      <DropdownMenuDeferredItem onSelect={() => onCopyChat?.()}>
        <HugeiconsIcon
          icon={Copy01Icon}
          strokeWidth={2}
          className="size-4 shrink-0"
        />
        Copy chat
      </DropdownMenuDeferredItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        variant="destructive"
        disabled={!isLoggedIn}
        onSelect={onDelete}
      >
        <HugeiconsIcon
          icon={Delete02Icon}
          strokeWidth={2}
          className="size-4 shrink-0"
        />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
