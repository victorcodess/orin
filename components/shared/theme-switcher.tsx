"use client";

import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useThemePreference } from "@/lib/hooks/use-theme-preference";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

const ThemeSwitcher = ({className}: {className?: string}) => {
  const hydrated = useHydrated();
  const { resolvedTheme, toggleLightDark } = useThemePreference();

  if (!hydrated) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  const iconClassName =
    "text-muted-foreground/90 rounded-full group-hover:text-foreground";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleLightDark}
      className={cn(className, "group hover:bg-accent hover:dark:bg-muted")}
    >
      {!isDark ? (
        <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className={cn(iconClassName, "size-4.5")} />
      ) : (
        <HugeiconsIcon icon={Sun01Icon} strokeWidth={2} className={cn(iconClassName, "size-5.5")} />
      )}
    </Button>
  );
};

export { ThemeSwitcher };
