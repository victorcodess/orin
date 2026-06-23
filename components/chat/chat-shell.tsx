"use client";

import { usePathname } from "next/navigation";

import { ChatComposerDock } from "@/components/chat/chat-composer";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";

export function ChatComposerDockGate() {
  const pathname = usePathname();
  const voiceStatus = useVoiceCallStore((state) => state.status);
  const voiceMode = useVoiceCallStore((state) => state.mode);
  const showComposer =
    pathname !== "/new" &&
    !(voiceStatus === "active" && voiceMode === "fullscreen");

  if (!showComposer) {
    return null;
  }

  return <ChatComposerDock />;
}
