"use client";

import { ConversationProvider } from "@elevenlabs/react";

import { VoiceCallOverlay } from "@/components/voice/voice-call-overlay";

export function VoiceCallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConversationProvider>
      {children}
      <VoiceCallOverlay />
    </ConversationProvider>
  );
}
