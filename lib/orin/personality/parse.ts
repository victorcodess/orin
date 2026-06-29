import {
  BASE_STYLE_IDS,
  DEFAULT_PERSONALITY_SETTINGS,
  TRAIT_LEVELS,
  type PersonalitySettings,
} from "@/lib/orin/personality/types";

function isBaseStyle(value: string): value is PersonalitySettings["baseStyle"] {
  return (BASE_STYLE_IDS as readonly string[]).includes(value);
}

function isTraitLevel(value: string): value is PersonalitySettings["warm"] {
  return (TRAIT_LEVELS as readonly string[]).includes(value);
}

export function parsePersonalitySettings(value: unknown): PersonalitySettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_PERSONALITY_SETTINGS;
  }

  const input = value as Record<string, unknown>;

  return {
    baseStyle:
      typeof input.baseStyle === "string" && isBaseStyle(input.baseStyle)
        ? input.baseStyle
        : DEFAULT_PERSONALITY_SETTINGS.baseStyle,
    warm:
      typeof input.warm === "string" && isTraitLevel(input.warm)
        ? input.warm
        : DEFAULT_PERSONALITY_SETTINGS.warm,
    enthusiastic:
      typeof input.enthusiastic === "string" && isTraitLevel(input.enthusiastic)
        ? input.enthusiastic
        : DEFAULT_PERSONALITY_SETTINGS.enthusiastic,
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
    a.baseStyle === b.baseStyle &&
    a.warm === b.warm &&
    a.enthusiastic === b.enthusiastic &&
    a.customInstructions.trim() === b.customInstructions.trim()
  );
}
