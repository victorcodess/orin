"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { NavChats } from "@/components/nav-chats";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { CircleIcon } from "@hugeicons/core-free-icons";

type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
  } | null;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="mt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-1.25 pl-3">
              <HugeiconsIcon
                icon={CircleIcon}
                className="size-7 shrink-0 fill-current/90 text-[#f97015]"
              />
              <span className="font-heading text-2xl font-semibold tracking-tighter text-foreground">
                Orin
              </span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="">
        <NavMain />
        <NavChats />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
