"use client";

import {
  Delete02Icon,
  Edit02Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type ChatOptionsMenuContentProps = {
  isLoggedIn: boolean;
  onRename?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
};

export function ChatOptionsMenuContent({
  isLoggedIn,
  onRename,
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
  );
}
