"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { BubbleChatTemporaryIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ChatTitle } from "@/components/chat/chat-title";
import { VoiceCallButton } from "@/components/voice/voice-call-button";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsLoggedIn } from "@/lib/stores/auth-store";

function getChatContext(pathname: string) {
  if (pathname === "/new") {
    return { isEmptyChat: true, conversationId: null as string | null };
  }

  const match = pathname.match(/^\/c\/([^/]+)$/);
  if (match) {
    return { isEmptyChat: false, conversationId: match[1] };
  }

  return { isEmptyChat: false, conversationId: null as string | null };
}

export function AppHeader() {
  const pathname = usePathname();
  const isLoggedIn = useIsLoggedIn();
  const { isEmptyChat, conversationId } = useMemo(
    () => getChatContext(pathname),
    [pathname],
  );

  return (
    <header className="to-background from-background/0 flex h-16 pb-2 shrink-0 items-center justify-between gap-2 bg-linear-to-t to-25% px-4 absolute inset-x-0 top-0 z-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger placement="inset" />

        {conversationId ? (
          <ChatTitle conversationId={conversationId} isLoggedIn={isLoggedIn} />
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {conversationId ? <VoiceCallButton conversationId={conversationId} /> : null}
        {isEmptyChat ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                className="hover:bg-accent hover:dark:bg-muted"
                aria-label="Start temporary chat"
              >
                <HugeiconsIcon
                  icon={BubbleChatTemporaryIcon}
                  strokeWidth={2}
                  className="size-4.75 shrink-0"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" align="center">
              Temporary chat
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </header>
  );
}
