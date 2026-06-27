"use client";

import { useEffect, useMemo, useState } from "react";

import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";

import {
  SettingsActions,
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsSkeletonRows,
} from "@/components/settings/settings-ui";
import { VoicePicker } from "@/components/elevenlabs/voice-picker";
import { Button } from "@/components/ui/button";
import type { VoiceOption } from "@/lib/elevenlabs/voices";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";

// Cached across mounts so re-opening the panel doesn't refetch/flash the picker.
let cachedVoices: { voices: VoiceOption[]; fallback: boolean } | null = null;

export function SettingsVoice() {
  const config = useAssistantConfigStore((state) => state.config);
  const isLoading = useAssistantConfigStore((state) => state.isLoading);
  const isSaving = useAssistantConfigStore((state) => state.isSaving);
  const error = useAssistantConfigStore((state) => state.error);
  const save = useAssistantConfigStore((state) => state.save);

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
    setVoiceId(config.voiceId);
  }, [config.voiceId]);

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
    () => voiceId !== config.voiceId,
    [config.voiceId, voiceId],
  );

  const pickerVoices = useMemo(
    () => voices as unknown as ElevenLabs.Voice[],
    [voices],
  );

  const handleSave = async () => {
    setSaved(false);
    const ok = await save({
      name: config.name,
      personality: config.personality,
      voiceId,
    });

    if (ok) {
      setSaved(true);
    }
  };

  if (isLoading) {
    return <SettingsSkeletonRows count={1} />;
  }

  return (
    <SettingsPage className="gap-5">
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

      <SettingsActions
        error={error}
        message={saved ? "Voice saved." : undefined}
      >
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </SettingsActions>
    </SettingsPage>
  );
}
