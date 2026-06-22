"use client";

import { usePathname } from "next/navigation";

import { ChatComposerDock } from "@/components/chat/chat-composer";

export function ChatComposerDockGate() {
  const pathname = usePathname();
  const showComposer = pathname !== "/new";

  if (!showComposer) {
    return null;
  }

  return <ChatComposerDock />;
}
