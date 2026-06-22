"use client";

import { usePathname } from "next/navigation";

import { ChatComposerDock } from "@/components/chat/chat-composer";

export function ChatShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showComposer = pathname !== "/new";

  return (
    <div data-chat-route className="relative flex h-full min-h-0 flex-1 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      {showComposer ? <ChatComposerDock /> : null}
    </div>
  );
}
