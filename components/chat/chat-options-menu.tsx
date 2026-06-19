"use client";

import {
  Delete02Icon,
  Edit02Icon,
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
  onDelete?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

export function ChatOptionsMenuContent({
  isLoggedIn,
  isFavorited = false,
  onRename,
  onFavorite,
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
          icon={Edit02Icon}
          strokeWidth={2}
          className="size-4 shrink-0"
        />
        Rename
      </DropdownMenuItem>
      <DropdownMenuDeferredItem disabled={!isLoggedIn} onSelect={() => onFavorite?.()}>
        <FavoriteHeartIcon filled={isFavorited} />
        {isFavorited ? "Unfavorite" : "Favorite"}
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
