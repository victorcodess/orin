"use client";

import { Call02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  VoiceCallTooltip,
  voiceCallStartKeys,
} from "@/components/voice/voice-call-keyboard-shortcuts";
import { toast } from "@/components/nexus-ui/toaster";
import { openSettings } from "@/lib/settings-routes";
import type { QuotaUsageSummary } from "@/lib/quotas/types";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUsageStore } from "@/lib/stores/usage-store";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";

type VoiceCallButtonProps = {
  conversationId?: string;
  disabled?: boolean;
};

function canStartExistingChatVoice(usage: QuotaUsageSummary | null) {
  if (!usage) {
    return true;
  }

  return (
    usage.remaining.voice_session > 0 ||
    (usage.keys.hasOpenaiKey && usage.keys.hasElevenlabsKey)
  );
}

function canStartNewChatVoice(usage: QuotaUsageSummary | null) {
  if (!usage) {
    return true;
  }

  const canCreateChat =
    usage.remaining.new_conversation > 0 ||
    (usage.tier === "authed" && usage.keys.hasOpenaiKey);

  return canCreateChat && canStartExistingChatVoice(usage);
}

function voiceBlockedToast(title: string, description: string) {
  toast.error(title, {
    description,
    action: {
      label: "Settings",
      onClick: () => {
        openSettings("usage");
      },
    },
  });
}

export function VoiceCallButton({
  conversationId,
  disabled = false,
}: VoiceCallButtonProps) {
  const userId = useAuthStore((state) => state.userId);
  const usage = useUsageStore((state) => state.usage);
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
            window.location.href = "/auth/login";
          },
        },
      });
      return;
    }

    if (conversationId) {
      if (!canStartExistingChatVoice(usage)) {
        voiceBlockedToast(
          "Voice allowance used",
          "Add your OpenAI and ElevenLabs API keys in Settings to continue.",
        );
        return;
      }

      requestStart(conversationId);
      return;
    }

    if (!canStartNewChatVoice(usage)) {
      const textBlocked =
        usage != null &&
        usage.remaining.new_conversation <= 0 &&
        !usage.keys.hasOpenaiKey;

      voiceBlockedToast(
        textBlocked ? "Can't start a new chat" : "Voice allowance used",
        textBlocked
          ? "Your free new-chat allowance is used. Add your OpenAI API key in Settings, or start a voice call from an existing chat."
          : "Add your OpenAI and ElevenLabs API keys in Settings to continue.",
      );
      return;
    }

    requestStartNewChat();
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
