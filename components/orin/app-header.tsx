"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BubbleChatTemporaryIcon, Share01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { ChatTitle } from "@/components/orin/chat-title";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";

function getChatContext(pathname: string) {
  if (pathname === "/chat") {
    return { isEmptyChat: true, conversationId: null as string | null };
  }

  const match = pathname.match(/^\/chat\/([^/]+)$/);
  if (match) {
    return { isEmptyChat: false, conversationId: match[1] };
  }

  return { isEmptyChat: false, conversationId: null as string | null };
}

function useIsLoggedIn() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  return isLoggedIn;
}

export function AppHeader() {
  const pathname = usePathname();
  const isLoggedIn = useIsLoggedIn();
  const { isEmptyChat, conversationId } = useMemo(
    () => getChatContext(pathname),
    [pathname],
  );
  const isActiveChat = Boolean(conversationId);

  const showTemporaryChatAction = isEmptyChat;
  const showShareAction = isActiveChat;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger placement="inset" />

        {conversationId ? (
          <ChatTitle conversationId={conversationId} isLoggedIn={isLoggedIn} />
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {showShareAction ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="hover:bg-accent hover:dark:bg-muted"
                  disabled={!isLoggedIn}
                  aria-label="Share chat"
                >
                  <HugeiconsIcon
                    icon={Share01Icon}
                    strokeWidth={2}
                    className="size-4.75 shrink-0"
                  />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              {isLoggedIn ? "Share chat" : "Sign in to share"}
            </TooltipContent>
          </Tooltip>
        ) : null}
        {showTemporaryChatAction ? (
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
