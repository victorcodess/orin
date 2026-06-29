import type { BaseStyleId, TraitLevel } from "@/lib/orin/personality/types";

export type PersonalityOption<T extends string = string> = {
  value: T;
  label: string;
  description: string;
};

export const BASE_STYLE_OPTIONS: PersonalityOption<BaseStyleId>[] = [
  {
    value: "default",
    label: "Default",
    description: "Balanced and natural — Orin's everyday voice",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished and precise",
  },
  {
    value: "friendly",
    label: "Friendly",
    description: "Warm and conversational",
  },
  {
    value: "candid",
    label: "Candid",
    description: "Direct and encouraging",
  },
  {
    value: "quirky",
    label: "Quirky",
    description: "Playful and imaginative",
  },
  {
    value: "efficient",
    label: "Efficient",
    description: "Concise and plain",
  },
  {
    value: "cynical",
    label: "Cynical",
    description: "Critical, with dry humor",
  },
];

export const TRAIT_LEVEL_OPTIONS: PersonalityOption<TraitLevel>[] = [
  { value: "default", label: "Default", description: "Follow your base style" },
  { value: "less", label: "Less", description: "Dial it down" },
  { value: "more", label: "More", description: "Dial it up" },
];
