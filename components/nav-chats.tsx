"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Message01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";

import type { ConversationRow } from "@/lib/ai/conversations";
import {
  getCachedConversations,
  setCachedConversations,
} from "@/lib/conversations-cache";
import { debugLog } from "@/lib/debug";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

function conversationLabel(conversation: ConversationRow) {
  return conversation.title?.trim() || "Untitled chat";
}

export function NavChats() {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);

  useEffect(() => {
    debugLog(
      "sidebar",
      "rendering conversations",
      conversations.map((conversation) => ({
        id: conversation.id,
        title: conversationLabel(conversation),
      })),
    );
  }, [conversations]);

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations", { cache: "no-store" });
        if (!response.ok || cancelled) {
          return;
        }

        const data = (await response.json()) as ConversationRow[];
        debugLog("sidebar", "supabase conversations", data);
        if (!cancelled) {
          setCachedConversations(pathname, data);
          setConversations(data);
        }
      } catch {
        // Keep the last known list if refresh fails.
      }
    }

    const cached = getCachedConversations(pathname);
    if (cached) {
      setConversations(cached);
    } else {
      void loadConversations();
    }

    const handleChange = () => {
      void loadConversations();
    };

    window.addEventListener("orin:conversations-changed", handleChange);

    return () => {
      cancelled = true;
      window.removeEventListener("orin:conversations-changed", handleChange);
    };
  }, [pathname]);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Recent</SidebarGroupLabel>
      <SidebarMenu>
        {conversations.length === 0 ? (
          <SidebarMenuItem>
            <SidebarMenuButton disabled className="text-muted-foreground">
              <HugeiconsIcon icon={Message01Icon} strokeWidth={2} className="size-4 shrink-0" />
              <span>No chats yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          conversations.map((conversation) => {
            const href = `/chat/${conversation.id}`;
            const isActive = pathname === href;

            return (
              <SidebarMenuItem key={conversation.id}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={href}>
                    <HugeiconsIcon icon={Message01Icon} strokeWidth={2} className="size-4 shrink-0" />
                    <span className="truncate">
                      {conversationLabel(conversation)}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
