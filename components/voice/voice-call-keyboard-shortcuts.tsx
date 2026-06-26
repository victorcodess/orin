"use client";

import { useConversationInput } from "@elevenlabs/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  escapeLabel,
  hasPrimaryModifier,
  isKeyboardShortcutsDialogOpen,
  matchesShortcut,
  primaryModifierLabel,
  shiftLabel,
} from "@/lib/keyboard-shortcuts";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";

const voiceCallStartKeys = () => [shiftLabel(), primaryModifierLabel(), "C"];
const voiceCallMuteKeys = () => [shiftLabel(), primaryModifierLabel(), "M"];
const voiceCallModeKeys = () => [shiftLabel(), primaryModifierLabel(), "E"];
const voiceCallEndKeys = () => [escapeLabel()];

export function VoiceCallTooltip({
  label,
  keys,
  children,
}: {
  label: string;
  keys?: string[];
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="rounded-full" side="bottom" align="center">
        {label}
        {keys?.length ? (
          <KbdGroup className="ml-1.5">
            {keys.map((key, index) => (
              <Kbd key={`${key}-${index}`} className="rounded-md!">
                {key}
              </Kbd>
            ))}
          </KbdGroup>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  voiceCallEndKeys,
  voiceCallModeKeys,
  voiceCallMuteKeys,
  voiceCallStartKeys,
};

function getConversationIdFromPathname(pathname: string) {
  const match = pathname.match(/^\/c\/([^/]+)$/);
  return match ? match[1] : null;
}

export function VoiceCallKeyboardShortcuts() {
  const pathname = usePathname();
  const conversationId = useMemo(
    () => getConversationIdFromPathname(pathname),
    [pathname],
  );

  const status = useVoiceCallStore((state) => state.status);
  const requestStart = useVoiceCallStore((state) => state.requestStart);
  const toggleMode = useVoiceCallStore((state) => state.toggleMode);
  const setDisconnecting = useVoiceCallStore((state) => state.setDisconnecting);

  const { isMuted, setMuted } = useConversationInput();

  const isCallLive = status !== "idle";
  const canToggleMute = status === "active";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isKeyboardShortcutsDialogOpen()) {
        return;
      }

      if (
        event.key === "Escape" &&
        !event.shiftKey &&
        !hasPrimaryModifier(event) &&
        !event.altKey &&
        isCallLive
      ) {
        event.preventDefault();
        setDisconnecting();
        return;
      }

      if (
        matchesShortcut(event, "c", { shift: true }) &&
        !event.altKey &&
        status === "idle" &&
        conversationId
      ) {
        event.preventDefault();
        requestStart(conversationId);
        return;
      }

      if (!isCallLive) {
        return;
      }

      if (
        matchesShortcut(event, "m", { shift: true }) &&
        !event.altKey &&
        canToggleMute
      ) {
        event.preventDefault();
        setMuted(!isMuted);
        return;
      }

      if (matchesShortcut(event, "e", { shift: true }) && !event.altKey) {
        event.preventDefault();
        toggleMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    canToggleMute,
    conversationId,
    isCallLive,
    isMuted,
    requestStart,
    setDisconnecting,
    setMuted,
    status,
    toggleMode,
  ]);

  return null;
}
