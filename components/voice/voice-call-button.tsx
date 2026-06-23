"use client";

import { Call02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useVoiceCallStore } from "@/lib/stores/voice-call-store";

type VoiceCallButtonProps = {
  conversationId: string;
  disabled?: boolean;
};

export function VoiceCallButton({
  conversationId,
  disabled = false,
}: VoiceCallButtonProps) {
  const status = useVoiceCallStore((state) => state.status);
  const requestStart = useVoiceCallStore((state) => state.requestStart);
  const isActive =
    useVoiceCallStore((state) => state.conversationId) === conversationId &&
    status !== "idle";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Button
            type="button"
            variant={isActive ? "default" : "ghost"}
            size="icon-lg"
            className="hover:bg-accent hover:dark:bg-muted"
            disabled={disabled || status === "connecting"}
            aria-label={isActive ? "Voice call active" : "Start voice call"}
            onClick={() => requestStart(conversationId)}
          >
            <HugeiconsIcon
              icon={Call02Icon}
              strokeWidth={2}
              className="size-4.75 shrink-0"
            />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="center">
        {isActive ? "Voice call active" : "Start voice call"}
      </TooltipContent>
    </Tooltip>
  );
}
