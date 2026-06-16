"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Add01Icon,
  Home01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { signalNewChat } from "@/components/chat/new-chat-view";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup className="mt-2">
      {/* <SidebarGroupLabel>Orin</SidebarGroupLabel> */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/chat"}>
            <Link href="/chat" onClick={signalNewChat}>
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                className="size-4 shrink-0"
              />
              <span>New chat</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="/chat">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="size-4 shrink-0"
              />
              <span>Search chats</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/"}>
            <Link href="/">
              <HugeiconsIcon
                icon={Home01Icon}
                strokeWidth={2}
                className="size-4 shrink-0"
              />
              <span>Home</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
