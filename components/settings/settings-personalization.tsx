"use client";

import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  SettingsActions,
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsRow,
  SettingsSectionIntro,
  SettingsSkeletonRows,
} from "@/components/settings/settings-ui";
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
import { useSettingsRouteDirty } from "@/lib/hooks/use-settings-route-dirty";
import { personalitySettingsEqual } from "@/lib/orin/personality/parse";
import {
  PERSONALITY_OPTIONS,
  type PersonalityOption,
} from "@/lib/orin/personality/ui-options";
import type { PersonalitySettings } from "@/lib/orin/personality/types";
import { VOICE_SPEED_OPTIONS, type VoiceSpeed } from "@/lib/orin/voice/speed";
import {
  useAssistantConfigQuery,
  saveAssistantConfig,
  resetAssistantConfig,
} from "@/lib/stores/assistant-config-store";
import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

function PersonalityDropdown<T extends string>({
  value,
  options,
  onValueChange,
  className,
  compact = false,
}: {
  value: T;
  options: PersonalityOption<T>[] | { value: T; label: string }[];
  onValueChange: (value: T) => void;
  className?: string;
  compact?: boolean;
}) {
  const selected =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "border-input bg-background/80 h-10 w-full justify-between rounded-3xl px-3.5 text-sm font-medium shadow-xs/1 sm:w-44",
            className
          )}
        >
          <span className="truncate">{selected.label}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="text-muted-foreground size-4 shrink-0"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-64">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onValueChange(next as T)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className={cn(
                "rounded-2xl pr-8 pl-3",
                compact ? "py-2" : "h-auto items-start py-2"
              )}
            >
              {compact ? (
                <span className="text-foreground text-sm font-medium">
                  {option.label}
                </span>
              ) : (
                <span className="flex flex-col gap-0.25 text-left">
                  <span className="text-foreground text-sm font-medium">
                    {option.label}
                  </span>
                  <span className="text-muted-foreground text-xs leading-relaxed font-[450]">
                    {"description" in option ? option.description : null}
                  </span>
                </span>
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SettingsPersonalization() {
  const {
    data: configData,
    isPending: isLoading,
    error: queryError,
  } = useAssistantConfigQuery();
  const config = configData?.config;
  const isDefault = configData?.isDefault ?? true;
  const [isSaving, startSaveTransition] = useTransition();

  const [personalitySettings, setPersonalitySettings] =
    useState<PersonalitySettings>(
      config?.personalitySettings ?? DEFAULT_ASSISTANT.personalitySettings,
    );
  const [voiceId, setVoiceId] = useState(config?.voiceId ?? DEFAULT_ASSISTANT.voiceId);
  const [voiceSpeed, setVoiceSpeed] = useState<VoiceSpeed>(
    config?.voiceSpeed ?? DEFAULT_ASSISTANT.voiceSpeed,
  );
  const [isDirty, setIsDirty] = useState(false);
  const loadErrorToasted = useRef(false);

  useEffect(() => {
    if (isDirty || !config) return;
    setPersonalitySettings(config.personalitySettings);
    setVoiceId(config.voiceId);
    setVoiceSpeed(config.voiceSpeed);
  }, [config, isDirty]);

  useEffect(() => {
    if (!isLoading && queryError && !loadErrorToasted.current) {
      loadErrorToasted.current = true;
      toast.error("Could not load assistant settings");
    }
  }, [isLoading, queryError]);

  const hasEdits = useMemo(
    () =>
      !config ||
      !personalitySettingsEqual(
        personalitySettings,
        config.personalitySettings,
      ) ||
      voiceId !== config.voiceId ||
      voiceSpeed !== config.voiceSpeed,
    [config, personalitySettings, voiceId, voiceSpeed],
  );

  const discardEdits = useCallback(() => {
    if (!config) return;
    setPersonalitySettings(config.personalitySettings);
    setVoiceId(config.voiceId);
    setVoiceSpeed(config.voiceSpeed);
    setIsDirty(false);
  }, [config]);

  useSettingsRouteDirty("personalization", hasEdits, discardEdits);

  const pickerVoices = useMemo(
    () => CURATED_VOICES as unknown as ElevenLabs.Voice[],
    []
  );

  const markDirty = () => {
    setIsDirty(true);
  };

  const updateSettings = (patch: Partial<PersonalitySettings>) => {
    markDirty();
    setPersonalitySettings((current) => ({ ...current, ...patch }));
  };

  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        await saveAssistantConfig({
          personalitySettings: {
            ...personalitySettings,
            customInstructions: personalitySettings.customInstructions.trim(),
          },
          voiceId,
          voiceSpeed,
        });
        setIsDirty(false);
        toast.success("Settings saved", { position: "bottom-center" });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't save settings",
        );
      }
    });
  };

  const handleReset = () => {
    startSaveTransition(async () => {
      try {
        await resetAssistantConfig();
        setIsDirty(false);
        toast.success("Reset to default", { position: "bottom-center" });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't reset settings",
        );
      }
    });
  };

  if (isLoading) {
    return <SettingsSkeletonRows count={3} />;
  }

  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <SettingsSectionIntro
          title="Personality"
          description="Sets how Orin shows up in conversations. Doesn't change what Orin can do."
          className="pb-2"
        />

        <SettingsRow
          title="Style"
          description="Orin's voice and approach in text and on calls."
        >
          <PersonalityDropdown
            value={personalitySettings.personality}
            options={PERSONALITY_OPTIONS}
            onValueChange={(personality) => updateSettings({ personality })}
          />
        </SettingsRow>

        <Separator className="bg-border/40" />
        <div className="px-4 py-4">
          <SettingsField
            label="Custom instructions"
            description="Anything else you want Orin to keep in mind."
            htmlFor="assistant-custom-instructions"
          >
            <Textarea
              id="assistant-custom-instructions"
              value={personalitySettings.customInstructions}
              rows={5}
              maxLength={4000}
              placeholder="Additional behavior, style, and tone preferences"
              onChange={(event) =>
                updateSettings({ customInstructions: event.target.value })
              }
            />
          </SettingsField>
        </div>
      </SettingsGroup>

      <SettingsGroup>
        <SettingsRow
          title="Voice"
          description="Orin's voice for read-aloud and calls."
        >
          <VoicePicker
            voices={pickerVoices}
            value={voiceId}
            voiceSpeed={voiceSpeed}
            onValueChange={(value) => {
              markDirty();
              setVoiceId(value);
            }}
            placeholder="Select a voice..."
          />
        </SettingsRow>

        <SettingsRow
          title="Speed"
          description="How fast Orin speaks on calls and read-aloud."
          withSeparator
        >
          <PersonalityDropdown
            value={voiceSpeed}
            options={VOICE_SPEED_OPTIONS}
            onValueChange={(value) => {
              markDirty();
              setVoiceSpeed(value);
            }}
            compact
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsActions>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!hasEdits || isSaving}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
        {hasEdits ? (
          <Button
            type="button"
            variant="outline"
            onClick={discardEdits}
            disabled={isSaving}
          >
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isDefault || isSaving}
          >
            Reset to default
          </Button>
        )}
      </SettingsActions>
    </SettingsPage>
  );
}
