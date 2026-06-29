"use client";

import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import type { VoiceOption } from "@/lib/elevenlabs/voices";
import { useSettingsRouteDirty } from "@/lib/hooks/use-settings-route-dirty";
import { personalitySettingsEqual } from "@/lib/orin/personality/parse";
import {
  BASE_STYLE_OPTIONS,
  TRAIT_LEVEL_OPTIONS,
  type PersonalityOption,
} from "@/lib/orin/personality/ui-options";
import type { PersonalitySettings } from "@/lib/orin/personality/types";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

let cachedVoices: { voices: VoiceOption[]; fallback: boolean } | null = null;

function PersonalityDropdown<T extends string>({
  value,
  options,
  onValueChange,
  className,
}: {
  value: T;
  options: PersonalityOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
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
              className="h-auto items-start rounded-2xl py-2 pr-8 pl-3"
            >
              <span className="flex flex-col gap-0.25 text-left">
                <span className="text-foreground text-sm font-medium">
                  {option.label}
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed font-[450]">
                  {option.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SettingsPersonalization() {
  const config = useAssistantConfigStore((state) => state.config);
  const isLoading = useAssistantConfigStore((state) => state.isLoading);
  const isSaving = useAssistantConfigStore((state) => state.isSaving);
  const isDefault = useAssistantConfigStore((state) => state.isDefault);
  const error = useAssistantConfigStore((state) => state.error);
  const save = useAssistantConfigStore((state) => state.save);
  const reset = useAssistantConfigStore((state) => state.reset);

  const [personalitySettings, setPersonalitySettings] =
    useState<PersonalitySettings>(config.personalitySettings);
  const [voiceId, setVoiceId] = useState(config.voiceId);
  const [isDirty, setIsDirty] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>(
    cachedVoices?.voices ?? []
  );
  const [usingFallback, setUsingFallback] = useState(
    cachedVoices?.fallback ?? false
  );
  const loadErrorToasted = useRef(false);

  useEffect(() => {
    if (isDirty) {
      return;
    }

    setPersonalitySettings(config.personalitySettings);
    setVoiceId(config.voiceId);
  }, [config.personalitySettings, config.voiceId, isDirty]);

  useEffect(() => {
    if (!isLoading && error && !loadErrorToasted.current) {
      loadErrorToasted.current = true;
      toast.error(error);
    }
  }, [isLoading, error]);

  useEffect(() => {
    if (cachedVoices) {
      return;
    }

    void fetch("/api/elevenlabs/voices", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load voices");
        }

        const data = (await response.json()) as {
          voices: VoiceOption[];
          fallback?: boolean;
        };
        cachedVoices = {
          voices: data.voices,
          fallback: Boolean(data.fallback),
        };
        setVoices(data.voices);
        setUsingFallback(Boolean(data.fallback));
      })
      .catch(() => {
        toast.error("Couldn't load voices", {
          description: "Try again later.",
        });
      });
  }, []);

  const hasEdits = useMemo(
    () =>
      !personalitySettingsEqual(
        personalitySettings,
        config.personalitySettings
      ) || voiceId !== config.voiceId,
    [config, personalitySettings, voiceId]
  );

  const discardEdits = useCallback(() => {
    setPersonalitySettings(config.personalitySettings);
    setVoiceId(config.voiceId);
    setIsDirty(false);
  }, [config.personalitySettings, config.voiceId]);

  useSettingsRouteDirty("personalization", hasEdits, discardEdits);

  const pickerVoices = useMemo(
    () => voices as unknown as ElevenLabs.Voice[],
    [voices]
  );

  const markDirty = () => {
    setIsDirty(true);
  };

  const updateSettings = (patch: Partial<PersonalitySettings>) => {
    markDirty();
    setPersonalitySettings((current) => ({ ...current, ...patch }));
  };

  const handleSave = async () => {
    const ok = await save({
      personalitySettings: {
        ...personalitySettings,
        customInstructions: personalitySettings.customInstructions.trim(),
      },
      voiceId,
    });

    if (ok) {
      setIsDirty(false);
      toast.success("Settings saved", { position: "bottom-center" });
      return;
    }

    toast.error(
      useAssistantConfigStore.getState().error ?? "Couldn't save settings"
    );
  };

  const handleReset = async () => {
    const ok = await reset();

    if (ok) {
      setIsDirty(false);
      toast.success("Reset to default", { position: "bottom-center" });
      return;
    }

    toast.error(
      useAssistantConfigStore.getState().error ?? "Couldn't reset settings"
    );
  };

  if (isLoading) {
    return <SettingsSkeletonRows count={3} />;
  }

  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <SettingsSectionIntro
          title="Base style and tone"
          description="Sets how Orin responds. This doesn't change what Orin can do."
          className="pb-2"
        />

        <SettingsRow
          title="Style"
          description="Orin's overall personality in text and on calls."
        >
          <PersonalityDropdown
            value={personalitySettings.baseStyle}
            options={BASE_STYLE_OPTIONS}
            onValueChange={(baseStyle) => updateSettings({ baseStyle })}
          />
        </SettingsRow>

        <SettingsSectionIntro
          title="Characteristics"
          description="Fine-tune warmth and energy on top of your base style."
          withSeparator
          className="pb-2"
        />

        <SettingsRow
          title="Warm"
          description="How caring and emotionally present Orin sounds."
        >
          <PersonalityDropdown
            value={personalitySettings.warm}
            options={TRAIT_LEVEL_OPTIONS}
            onValueChange={(warm) => updateSettings({ warm })}
          />
        </SettingsRow>

        <SettingsRow
          title="Enthusiastic"
          description="How much energy and momentum Orin brings."
        >
          <PersonalityDropdown
            value={personalitySettings.enthusiastic}
            options={TRAIT_LEVEL_OPTIONS}
            onValueChange={(enthusiastic) => updateSettings({ enthusiastic })}
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
        <div className="px-4 py-4">
          <SettingsField
            label="Voice"
            description="Orin's voice for read-aloud and calls."
            htmlFor="assistant-voice"
          >
            <VoicePicker
              voices={pickerVoices}
              value={voiceId}
              onValueChange={(value) => {
                markDirty();
                setVoiceId(value);
              }}
              placeholder="Select a voice..."
            />

            {usingFallback ? (
              <p className="text-muted-foreground mt-2 text-xs">
                Showing common voices. To browse your full library, enable the{" "}
                <span className="text-foreground font-medium">voices_read</span>{" "}
                permission on your ElevenLabs API key.
              </p>
            ) : null}
          </SettingsField>
        </div>
      </SettingsGroup>

      <SettingsActions>
        <Button
          type="button"
          onClick={() => void handleSave()}
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
            onClick={() => void handleReset()}
            disabled={isDefault || isSaving}
          >
            Reset to default
          </Button>
        )}
      </SettingsActions>
    </SettingsPage>
  );
}
