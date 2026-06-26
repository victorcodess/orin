"use client";

import { ConversationProvider } from "@elevenlabs/react";
import { Suspense } from "react";

import { VoiceCallKeyboardShortcuts } from "@/components/voice/voice-call-keyboard-shortcuts";
import { VoiceCallOverlay } from "@/components/voice/voice-call-overlay";

export function VoiceCallProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
