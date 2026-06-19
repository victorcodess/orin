import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";

type FavoriteHeartIconProps = {
  filled?: boolean;
  className?: string;
};

export function FavoriteHeartIcon({
  filled = false,
  className,
}: FavoriteHeartIconProps) {
  return (
    <HugeiconsIcon
      icon={FavouriteIcon}
      strokeWidth={filled ? 0 : 2}
      className={cn("size-4 shrink-0", filled && "fill-current", className)}
    />
  );
}
