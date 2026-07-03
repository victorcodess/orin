import {
  PERSONALITY_IDS,
  DEFAULT_PERSONALITY_SETTINGS,
  type PersonalitySettings,
} from "@/lib/orin/personality/types";

function isPersonalityId(
  value: string,
): value is PersonalitySettings["personality"] {
  return (PERSONALITY_IDS as readonly string[]).includes(value);
}

export function parsePersonalitySettings(value: unknown): PersonalitySettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_PERSONALITY_SETTINGS;
  }

  const input = value as Record<string, unknown>;

  return {
    personality:
      typeof input.personality === "string" &&
      isPersonalityId(input.personality)
        ? input.personality
        : DEFAULT_PERSONALITY_SETTINGS.personality,
    customInstructions:
      typeof input.customInstructions === "string"
        ? input.customInstructions.slice(0, 4000)
        : DEFAULT_PERSONALITY_SETTINGS.customInstructions,
  };
}

export function personalitySettingsEqual(
  a: PersonalitySettings,
  b: PersonalitySettings,
) {
  return (
    a.personality === b.personality &&
    a.customInstructions.trim() === b.customInstructions.trim()
  );
}
