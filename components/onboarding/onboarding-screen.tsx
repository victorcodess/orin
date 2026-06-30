"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { completeOnboarding } from "@/app/auth/actions";
import { VoicePicker } from "@/components/elevenlabs/voice-picker";
import { toast } from "@/components/nexus-ui/toaster";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { CURATED_VOICES } from "@/lib/elevenlabs/voices";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";
import { personalitySettingsEqual } from "@/lib/orin/personality/parse";
import {
  BASE_STYLE_OPTIONS,
  TRAIT_LEVEL_OPTIONS,
} from "@/lib/orin/personality/ui-options";
import type { PersonalitySettings } from "@/lib/orin/personality/types";
import {
  VOICE_SPEED_OPTIONS,
  type VoiceSpeed,
} from "@/lib/orin/voice/speed";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";
import { cn } from "@/lib/utils";

function TraitDropdown({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between sm:w-44">
          <span className="truncate">{selected.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-64">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OnboardingScreen() {
  const config = useAssistantConfigStore((state) => state.config);
  const isLoading = useAssistantConfigStore((state) => state.isLoading);
  const save = useAssistantConfigStore((state) => state.save);
  const [isPending, startTransition] = useTransition();
  const [personalitySettings, setPersonalitySettings] =
    useState<PersonalitySettings>(DEFAULT_ASSISTANT.personalitySettings);
  const [voiceId, setVoiceId] = useState<string>(DEFAULT_ASSISTANT.voiceId);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(DEFAULT_ASSISTANT.voiceSpeed);

  useEffect(() => {
    if (!config || isLoading) {
      return;
    }

    setPersonalitySettings(config.personalitySettings);
    setVoiceId(config.voiceId);
    setVoiceSpeed(config.voiceSpeed);
  }, [config, isLoading]);

  const updateSettings = useCallback((patch: Partial<PersonalitySettings>) => {
    setPersonalitySettings((current) => ({ ...current, ...patch }));
  }, []);

  const handleContinue = () => {
    startTransition(async () => {
      const saved = await save({
        personalitySettings,
        voiceId,
        voiceSpeed,
      });

      if (!saved) {
        toast.error("Could not save your preferences");
        return;
      }

      await completeOnboarding();
    });
  };

  const handleSkip = () => {
    startTransition(async () => {
      await completeOnboarding();
    });
  };

  const hasEdits =
    !personalitySettingsEqual(personalitySettings, DEFAULT_ASSISTANT.personalitySettings) ||
    voiceId !== DEFAULT_ASSISTANT.voiceId ||
    voiceSpeed !== DEFAULT_ASSISTANT.voiceSpeed;

  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-muted-foreground text-sm font-medium">Welcome to Orin</p>
          <h1 className="font-sans text-3xl font-semibold tracking-tight">
            Make Orin yours
          </h1>
          <p className="text-muted-foreground text-sm">
            Pick a tone and voice. You can change these anytime in Settings.
          </p>
        </div>

        <div className="border-border/60 space-y-6 rounded-3xl border p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Style</span>
              <TraitDropdown
                value={personalitySettings.baseStyle}
                options={BASE_STYLE_OPTIONS}
                onValueChange={(baseStyle) =>
                  updateSettings({ baseStyle: baseStyle as PersonalitySettings["baseStyle"] })
                }
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Warmth</span>
              <TraitDropdown
                value={personalitySettings.warm}
                options={TRAIT_LEVEL_OPTIONS}
                onValueChange={(warm) =>
                  updateSettings({ warm: warm as PersonalitySettings["warm"] })
                }
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium">Custom instructions</span>
            <Textarea
              value={personalitySettings.customInstructions}
              rows={4}
              maxLength={4000}
              placeholder="Optional — how should Orin talk to you?"
              onChange={(event) =>
                updateSettings({ customInstructions: event.target.value })
              }
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-medium">Voice</p>
            <VoicePicker
              voices={CURATED_VOICES}
              value={voiceId}
              voiceSpeed={voiceSpeed}
              onValueChange={setVoiceId}
              placeholder="Select a voice..."
            />
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium">Speaking speed</span>
            <TraitDropdown
              value={voiceSpeed}
              options={VOICE_SPEED_OPTIONS}
              onValueChange={(value) => setVoiceSpeed(value as VoiceSpeed)}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={handleSkip}
          >
            Skip for now
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={handleContinue}
            className={cn(!hasEdits && "sm:min-w-32")}
          >
            {isPending ? "Saving..." : "Continue to Orin"}
          </Button>
        </div>
      </div>
    </div>
  );
}
