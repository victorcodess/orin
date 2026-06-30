"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { ChatTitle } from "@/components/chat/chat-title";
import { VoiceCallButton } from "@/components/voice/voice-call-button";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
        {isEmptyChat || conversationId ? (
          <VoiceCallButton conversationId={conversationId ?? undefined} />
        ) : null}
      </div>
    </header>
  );
}
