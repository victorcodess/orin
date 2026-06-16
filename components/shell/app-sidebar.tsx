"use client";

import Link from "next/link";
import { Suspense, type ComponentProps } from "react";
import { NavChats } from "@/components/shell/nav-chats";
import { NavMain } from "@/components/shell/nav-main";
import { NavUser } from "@/components/shell/nav-user";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { CircleIcon } from "@hugeicons/core-free-icons";

type AppSidebarProps = ComponentProps<typeof Sidebar>;

export function AppSidebar({ ...props }: AppSidebarProps) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader className="mt-1">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <Link
              href="/"
              className="ml-1 flex items-center gap-1.25 px-2 hover:opacity-80 transition-opacity"
            >
              <HugeiconsIcon
                icon={CircleIcon}
                className="size-7 shrink-0 fill-current/90 text-[#f97015]"
              />
              <span className="font-heading text-foreground text-2xl font-semibold tracking-tighter">
                Orin
              </span>
            </Link>
            <SidebarTrigger placement="sidebar" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="">
        <Suspense fallback={null}>
          <NavMain />
        </Suspense>
        <Suspense fallback={null}>
          <NavChats />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
