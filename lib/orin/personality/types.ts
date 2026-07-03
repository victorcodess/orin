export const PERSONALITY_IDS = [
  "warm",
  "curious",
  "playful",
  "calm",
  "direct",
] as const;

export type PersonalityId = (typeof PERSONALITY_IDS)[number];

export type PersonalitySettings = {
  personality: PersonalityId;
  customInstructions: string;
};

export const DEFAULT_PERSONALITY_SETTINGS: PersonalitySettings = {
  personality: "warm",
  customInstructions: "",
};
