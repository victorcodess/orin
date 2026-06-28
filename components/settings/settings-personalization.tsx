"use client";

import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import { useEffect, useMemo, useState } from "react";

import {
  SettingsActions,
  SettingsCardOption,
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsSkeletonRows,
} from "@/components/settings/settings-ui";
import { VoicePicker } from "@/components/elevenlabs/voice-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { VoiceOption } from "@/lib/elevenlabs/voices";
import { PERSONALITY_PRESETS } from "@/lib/orin/personality-presets";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";

// Cached across mounts so re-opening the panel doesn't refetch/flash the picker.
let cachedVoices: { voices: VoiceOption[]; fallback: boolean } | null = null;

export function SettingsPersonalization() {
  const config = useAssistantConfigStore((state) => state.config);
  const isLoading = useAssistantConfigStore((state) => state.isLoading);
  const isSaving = useAssistantConfigStore((state) => state.isSaving);
  const isDefault = useAssistantConfigStore((state) => state.isDefault);
  const error = useAssistantConfigStore((state) => state.error);
  const save = useAssistantConfigStore((state) => state.save);
  const reset = useAssistantConfigStore((state) => state.reset);

  const [name, setName] = useState(config.name);
  const [personality, setPersonality] = useState(config.personality);
  const [voiceId, setVoiceId] = useState(config.voiceId);
  const [voices, setVoices] = useState<VoiceOption[]>(
    cachedVoices?.voices ?? [],
  );
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(
    cachedVoices?.fallback ?? false,
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(config.name);
    setPersonality(config.personality);
    setVoiceId(config.voiceId);
  }, [config]);

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
        setVoicesError("Could not load voices. Try again later.");
      });
  }, []);

  const isDirty = useMemo(
    () =>
      name.trim() !== config.name ||
      personality.trim() !== config.personality ||
      voiceId !== config.voiceId,
    [config, name, personality, voiceId],
  );

  const pickerVoices = useMemo(
    () => voices as unknown as ElevenLabs.Voice[],
    [voices],
  );

  const handleSave = async () => {
    setSaved(false);
    const ok = await save({
      name: name.trim(),
      personality: personality.trim(),
      voiceId,
    });

    if (ok) {
      setSaved(true);
    }
  };

  const handleReset = async () => {
    setSaved(false);
    const ok = await reset();

    if (ok) {
      setSaved(true);
    }
  };

  if (isLoading) {
    return <SettingsSkeletonRows count={3} />;
  }

  return (
    <SettingsPage className="gap-5">
      <SettingsGroup>
        <div className="px-4 py-4">
          <SettingsField
            label="Assistant name"
            description="What Orin should call itself in chat and on calls."
            htmlFor="assistant-name"
          >
            <Input
              id="assistant-name"
              value={name}
              maxLength={32}
              onChange={(event) => {
                setSaved(false);
                setName(event.target.value);
              }}
              placeholder="Orin"
            />
          </SettingsField>
        </div>
      </SettingsGroup>

      <SettingsGroup>
        <div className="flex flex-col gap-4 px-4 py-4">
          <SettingsField
            label="Personality"
            description="Pick a preset or describe how Orin should sound and behave."
            htmlFor="assistant-personality"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {PERSONALITY_PRESETS.map((preset) => (
                <SettingsCardOption
                  key={preset.id}
                  active={personality === preset.personality}
                  title={preset.label}
                  description={preset.description}
                  onClick={() => {
                    setSaved(false);
                    setPersonality(preset.personality);
                  }}
                />
              ))}
            </div>
            <Textarea
              id="assistant-personality"
              value={personality}
              rows={8}
              maxLength={4000}
              onChange={(event) => {
                setSaved(false);
                setPersonality(event.target.value);
              }}
              placeholder="Describe Orin's personality..."
            />
          </SettingsField>
        </div>
      </SettingsGroup>

      <SettingsGroup>
        <div className="px-4 py-4">
          <SettingsField
            label="Voice"
            description="Orin's voice for read-aloud and live calls."
            htmlFor="assistant-voice"
          >
            {voicesError ? (
              <p className="text-sm text-destructive">{voicesError}</p>
            ) : (
              <VoicePicker
                voices={pickerVoices}
                value={voiceId}
                onValueChange={(value) => {
                  setSaved(false);
                  setVoiceId(value);
                }}
                placeholder="Select a voice..."
              />
            )}

            {usingFallback ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Showing common voices. To browse your full library, enable the{" "}
                <span className="font-medium text-foreground">voices_read</span>{" "}
                permission on your ElevenLabs API key.
              </p>
            ) : null}
          </SettingsField>
        </div>
      </SettingsGroup>

      <SettingsActions error={error} message={saved ? "Settings saved." : undefined}>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleReset()}
          disabled={isDefault || isSaving}
        >
          Reset to default
        </Button>
      </SettingsActions>
    </SettingsPage>
  );
}
