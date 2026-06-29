import { DEFAULT_PERSONALITY_SETTINGS } from "@/lib/orin/personality/types";
import type { PersonalitySettings } from "@/lib/orin/personality/types";

export const ORIN_NAME = "Orin" as const;

export const DEFAULT_ASSISTANT = {
  personalitySettings: DEFAULT_PERSONALITY_SETTINGS,
  voiceId: "TyAD2ntJFdDReoa55SLn",
} as const;

export type AssistantConfig = {
  personalitySettings: PersonalitySettings;
  voiceId: string;
};
