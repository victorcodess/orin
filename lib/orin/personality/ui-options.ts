import type { PersonalityId } from "@/lib/orin/personality/types";

export type PersonalityOption<T extends string = string> = {
  value: T;
  label: string;
  description: string;
};

export const PERSONALITY_OPTIONS: PersonalityOption<PersonalityId>[] = [
  {
    value: "warm",
    label: "Warm",
    description: "Caring, emotionally present, easy to open up to",
  },
  {
    value: "curious",
    label: "Curious",
    description: "Intellectually engaged, asks good questions, thinks alongside you",
  },
  {
    value: "playful",
    label: "Playful",
    description: "Light, creative, and fun without losing substance",
  },
  {
    value: "calm",
    label: "Calm",
    description: "Steady, unhurried, and grounding",
  },
  {
    value: "direct",
    label: "Direct",
    description: "Clear, honest, and straight to the point",
  },
];

export const PERSONALITY_MODEL_ITEMS = PERSONALITY_OPTIONS.map(
  ({ value, label, description }) => ({
    value,
    title: label,
    description,
  }),
);
