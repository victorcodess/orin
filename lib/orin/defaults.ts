import { DEFAULT_PERSONALITY_SETTINGS } from "@/lib/orin/personality/types";
import type { PersonalitySettings } from "@/lib/orin/personality/types";
import {
  DEFAULT_VOICE_SPEED,
  type VoiceSpeed,
} from "@/lib/orin/voice/speed";

export const ORIN_NAME = "Orin" as const;

export const DEFAULT_ASSISTANT = {
  personalitySettings: DEFAULT_PERSONALITY_SETTINGS,
  voiceId: "kdmDKE6EkgrWrrykO9Qt",
  voiceSpeed: DEFAULT_VOICE_SPEED,
} as const;

export type AssistantConfig = {
  personalitySettings: PersonalitySettings;
  voiceId: string;
  voiceSpeed: VoiceSpeed;
};
