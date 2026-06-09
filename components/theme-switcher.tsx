"use client";

import { Moon02Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }


  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {!isDark ? (
        <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className={"size-4.5 text-primary/90"} />
      ) : (
        <HugeiconsIcon icon={Sun01Icon} strokeWidth={2} className={"size-5.5 text-primary/90"} />
      )}
    </Button>
  );
};

export { ThemeSwitcher };
