"use client";

import { Button } from "@/components/ui/button";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";
import { ArrowUp, Phone } from "lucide-react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActionGroup,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/nexus-ui/prompt-input";

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
                <Phone className="size-4" />
              </Button>
            </PromptInputAction>
          </PromptInputActionGroup>
          <PromptInputActionGroup>
            <PromptInputAction asChild>
              <Button size="icon" className="size-8 rounded-full" disabled>
                <ArrowUp className="size-4" />
              </Button>
            </PromptInputAction>
          </PromptInputActionGroup>
        </PromptInputActions>
      </PromptInput>
      <p className="text-xs text-muted-foreground text-center">
        Chat and voice coming in Phase 1. Foundation is ready.
      </p>
    </div>
  );
}
