"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home01Icon } from "@hugeicons/core-free-icons";

import { NewChatButton } from "@/components/orin/new-chat-button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Orin</SidebarGroupLabel>
      <SidebarMenu>
        <NewChatButton />
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip="Home"
            isActive={pathname === "/"}
          >
            <Link href="/">
              <HugeiconsIcon icon={Home01Icon} strokeWidth={2} className="size-4 shrink-0" />
              <span>Home</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
