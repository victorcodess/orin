"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Add01Icon,
  Home01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";

import { signalNewChat } from "@/components/chat/new-chat-view";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useKeyboardShortcutLabels } from "@/lib/hooks/use-keyboard-shortcut-labels";
import { openSearchChatsDialog } from "@/lib/search-chats";
import { HugeiconsIcon } from "@hugeicons/react";

function NavMenuShortcut({ keys }: { keys: string[] }) {
  return (
    <KbdGroup className="ml-auto shrink-0 group-hover/menu-item:opacity-100 group-data-[collapsible=icon]:hidden max-md:hidden md:opacity-0">
      {keys.map((key, index) => (
        <Kbd key={`${key}-${index}`} className="bg-sidebar dark:bg-muted">
          {key}
        </Kbd>
      ))}
    </KbdGroup>
  );
}

export function NavMain() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { modifier, shift } = useKeyboardShortcutLabels();

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarGroup className="mt-2">
      {/* <SidebarGroupLabel>Orin</SidebarGroupLabel> */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/new"}>
            <Link
              href="/new"
              onClick={() => {
                signalNewChat();
                closeMobileSidebar();
              }}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                className="size-4 shrink-0"
              />
              <span>New chat</span>
              <NavMenuShortcut keys={[shift, modifier, "O"]} />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="cursor-pointer"
            onClick={() => {
              openSearchChatsDialog();
              closeMobileSidebar();
            }}
          >
            <HugeiconsIcon
              icon={Search01Icon}
              strokeWidth={2}
              className="size-4 shrink-0"
            />
            <span>Search chats</span>
            <NavMenuShortcut keys={[modifier, "K"]} />
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={pathname === "/"}>
            <Link href="/" onClick={closeMobileSidebar}>
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
