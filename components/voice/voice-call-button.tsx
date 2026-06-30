"use client";

import { Call02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  VoiceCallTooltip,
  voiceCallStartKeys,
} from "@/components/voice/voice-call-keyboard-shortcuts";
import { toast } from "@/components/nexus-ui/toaster";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";

type VoiceCallButtonProps = {
  conversationId?: string;
  disabled?: boolean;
};

export function VoiceCallButton({
  conversationId,
  disabled = false,
}: VoiceCallButtonProps) {
  const userId = useAuthStore((state) => state.userId);
  const status = useVoiceCallStore((state) => state.status);
  const activeConversationId = useVoiceCallStore(
    (state) => state.conversationId,
  );
  const requestStart = useVoiceCallStore((state) => state.requestStart);
  const requestStartNewChat = useVoiceCallStore(
    (state) => state.requestStartNewChat,
  );

  const targetId = conversationId ?? activeConversationId;
  const isActive =
    targetId != null &&
    activeConversationId === targetId &&
    status !== "idle";

  const handleClick = () => {
    if (userId === null) {
      toast.error("Sign in for voice calls", {
        description: "Voice calls are available after you create an account.",
        action: {
          label: "Sign up",
          onClick: () => {
            window.location.href = "/auth/sign-up";
          },
        },
      });
      return;
    }

    if (conversationId) {
      requestStart(conversationId);
    } else {
      requestStartNewChat();
    }
  };

  return (
    <VoiceCallTooltip
      label={isActive ? "Voice call active" : "Start voice call"}
      keys={isActive ? undefined : voiceCallStartKeys()}
    >
      <span className="inline-flex">
        <Button
          type="button"
          variant={isActive ? "default" : "ghost"}
          size="icon-lg"
          className="hover:bg-accent hover:dark:bg-muted"
          disabled={disabled || status === "connecting" || userId === undefined}
          aria-label={isActive ? "Voice call active" : "Start voice call"}
          onClick={handleClick}
        >
          <HugeiconsIcon
            icon={Call02Icon}
            strokeWidth={2}
            className="size-5 shrink-0"
          />
        </Button>
      </span>
    </VoiceCallTooltip>
  );
}
