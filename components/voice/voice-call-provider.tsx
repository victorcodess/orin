"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { Suspense } from "react";

import { VoiceCallKeyboardShortcuts } from "@/components/voice/voice-call-keyboard-shortcuts";
import { VoiceCallOverlay } from "@/components/voice/voice-call-overlay";
import { useNewChatVoiceCallRouting } from "@/lib/hooks/use-new-chat-voice-call";

export function VoiceCallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useNewChatVoiceCallRouting();

  return (
    <ConversationProvider>
      {children}
      <Suspense fallback={null}>
        <VoiceCallKeyboardShortcuts />
      </Suspense>
      <VoiceCallOverlay />
    </ConversationProvider>
  );
}
