"use client";

import { usePathname } from "next/navigation";

import { ChatComposerDock } from "@/components/chat/chat-composer";

export function ChatComposerDockGate() {
  const pathname = usePathname();

  // Keep the composer mounted during fullscreen calls (the overlay covers it),
  // so collapsing back to inline reveals the call panel without a flash.
  if (pathname === "/new") {
    return null;
  }

  return <ChatComposerDock />;
}
