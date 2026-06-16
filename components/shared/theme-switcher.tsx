"use client";

import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

const ThemeSwitcher = ({className}: {className?: string}) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }


  const isDark = resolvedTheme === "dark";

  const iconClassName = "text-muted-foreground/90 rounded-full";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(className, "hover:bg-accent hover:dark:bg-muted")}
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
