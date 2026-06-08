"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

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
          <Plus />
          <span>New chat</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
