export const BASE_STYLE_IDS = [
  "default",
  "professional",
  "friendly",
  "candid",
  "quirky",
  "efficient",
  "cynical",
] as const;

export type BaseStyleId = (typeof BASE_STYLE_IDS)[number];

export const TRAIT_LEVELS = ["default", "less", "more"] as const;

export type TraitLevel = (typeof TRAIT_LEVELS)[number];

export type PersonalitySettings = {
  baseStyle: BaseStyleId;
  warm: TraitLevel;
  enthusiastic: TraitLevel;
  customInstructions: string;
};

export const DEFAULT_PERSONALITY_SETTINGS: PersonalitySettings = {
  baseStyle: "default",
  warm: "default",
  enthusiastic: "default",
  customInstructions: "",
};
