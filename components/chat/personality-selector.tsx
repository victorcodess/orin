"use client";

import { useCallback, useRef } from "react";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorLabel,
  ModelSelectorRadioGroup,
  ModelSelectorRadioItem,
  ModelSelectorTrigger,
} from "@/components/nexus-ui/model-selector";
import { toast } from "@/components/nexus-ui/toaster";
import { PERSONALITY_MODEL_ITEMS } from "@/lib/orin/personality/ui-options";
import type { PersonalityId } from "@/lib/orin/personality/types";
import {
  useAssistantConfig,
  useAssistantConfigStore,
} from "@/lib/stores/assistant-config-store";
import { cn } from "@/lib/utils";

type PersonalitySelectorProps = {
  disabled?: boolean;
  className?: string;
};

function personalityLabel(personalityId: PersonalityId) {
  return (
    PERSONALITY_MODEL_ITEMS.find((item) => item.value === personalityId)
      ?.title ?? personalityId
  );
}

export function PersonalitySelector({
  disabled = false,
  className,
}: PersonalitySelectorProps) {
  const config = useAssistantConfig();
  const applyConfig = useAssistantConfigStore((state) => state.applyConfig);
  const save = useAssistantConfigStore((state) => state.save);
  const saveGenerationRef = useRef(0);
  const personality = config.personalitySettings.personality;

  const handleValueChange = useCallback(
    async (nextPersonality: string) => {
      const personalityId = nextPersonality as PersonalityId;
      if (personalityId === personality) {
        return;
      }

      const previousConfig = config;
      const nextConfig = {
        ...config,
        personalitySettings: {
          ...config.personalitySettings,
          personality: personalityId,
        },
      };
      const saveGeneration = ++saveGenerationRef.current;

      applyConfig(nextConfig);

      const ok = await save(nextConfig);
      if (saveGeneration !== saveGenerationRef.current) {
        return;
      }

      if (ok) {
        toast.success(`Switched to ${personalityLabel(personalityId)}`, {
          position: "bottom-center",
        });
        return;
      }

      const current = useAssistantConfigStore.getState().config;
      if (current.personalitySettings.personality === personalityId) {
        applyConfig(previousConfig);
      }

      toast.error(
        useAssistantConfigStore.getState().error ??
          "Couldn't update personality"
      );
    },
    [applyConfig, config, personality, save]
  );

  return (
    <ModelSelector
      value={personality}
      onValueChange={(value) => void handleValueChange(value)}
      items={PERSONALITY_MODEL_ITEMS}
      // open
    >
      <ModelSelectorTrigger
        variant="ghost"
        disabled={disabled}
        className={cn(
          "-mr-1.5 h-9 max-w-32 px-2.5 text-sm font-medium",
          className
        )}
      />
      <ModelSelectorContent align="end" className="w-34 min-w-0">
        <ModelSelectorGroup>
          <ModelSelectorLabel>Personality</ModelSelectorLabel>
          <ModelSelectorRadioGroup
            value={personality}
            onValueChange={(value) => void handleValueChange(value)}
          >
            {PERSONALITY_MODEL_ITEMS.map((item) => (
              <ModelSelectorRadioItem
                key={item.value}
                value={item.value}
                title={item.title}
                // description={item.description}
              />
            ))}
          </ModelSelectorRadioGroup>
        </ModelSelectorGroup>
      </ModelSelectorContent>
    </ModelSelector>
  );
}
