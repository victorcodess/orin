"use client";

import { useEffect, useMemo, useState } from "react";

import {
  SettingsActions,
  SettingsCardOption,
  SettingsField,
  SettingsGroup,
  SettingsPage,
  SettingsSkeletonRows,
} from "@/components/settings/settings-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PERSONALITY_PRESETS } from "@/lib/orin/personality-presets";
import { useAssistantConfigStore } from "@/lib/stores/assistant-config-store";

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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(config.name);
    setPersonality(config.personality);
  }, [config]);

  const isDirty = useMemo(
    () =>
      name.trim() !== config.name ||
      personality.trim() !== config.personality,
    [config, name, personality],
  );

  const handleSave = async () => {
    setSaved(false);
    const ok = await save({
      name: name.trim(),
      personality: personality.trim(),
      voiceId: config.voiceId,
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
    return <SettingsSkeletonRows count={2} />;
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
