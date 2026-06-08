"use client";

import {
  LaptopIcon,
  Moon02Icon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";

const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const iconClassName = "size-4 text-muted-foreground";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={"sm"}>
          {theme === "light" ? (
            <HugeiconsIcon key="light" icon={Sun01Icon} strokeWidth={2} className={iconClassName} />
          ) : theme === "dark" ? (
            <HugeiconsIcon key="dark" icon={Moon02Icon} strokeWidth={2} className={iconClassName} />
          ) : (
            <HugeiconsIcon key="system" icon={LaptopIcon} strokeWidth={2} className={iconClassName} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(e) => setTheme(e)}
        >
          <DropdownMenuRadioItem className="flex gap-2" value="light">
            <HugeiconsIcon icon={Sun01Icon} strokeWidth={2} className={iconClassName} />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="dark">
            <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} className={iconClassName} />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className="flex gap-2" value="system">
            <HugeiconsIcon icon={LaptopIcon} strokeWidth={2} className={iconClassName} />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { ThemeSwitcher };
