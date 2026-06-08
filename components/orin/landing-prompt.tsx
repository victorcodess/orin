"use client";

import { ArrowUp01Icon, Call02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActionGroup,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/nexus-ui/prompt-input";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";

export function LandingPrompt() {
  return (
    <div className="flex flex-col gap-3">
      <PromptInput>
        <PromptInputTextarea
          placeholder={`Message ${DEFAULT_ASSISTANT.name}...`}
        />
        <PromptInputActions>
          <PromptInputActionGroup>
            <PromptInputAction asChild>
              <Button variant="ghost" size="icon" className="size-8" disabled>
                <HugeiconsIcon icon={Call02Icon} strokeWidth={2} className="size-4 shrink-0" />
              </Button>
            </PromptInputAction>
          </PromptInputActionGroup>
          <PromptInputActionGroup>
            <PromptInputAction asChild>
              <Button size="icon" className="size-8 rounded-full" disabled>
                <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-4 shrink-0" />
              </Button>
            </PromptInputAction>
          </PromptInputActionGroup>
        </PromptInputActions>
      </PromptInput>
      <p className="text-xs text-muted-foreground text-center">
        Text chat is live — voice calls coming in Phase 2.
      </p>
    </div>
  );
}
