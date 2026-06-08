"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Add01Icon } from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NewChatButton() {
  const pathname = usePathname();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip="New chat"
        isActive={pathname === "/chat"}
      >
        <Link href="/chat">
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4 shrink-0" />
          <span>New chat</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
