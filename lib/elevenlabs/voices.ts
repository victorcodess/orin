import {
  DEFAULT_VOICE_SPEED,
  type VoiceSpeed,
} from "@/lib/orin/voice/speed";

export type VoiceOption = {
  voiceId: string;
  name: string;
};

/**
 * Curated conversational voices from ElevenLabs library recommendations.
 * @see https://elevenlabs.io/docs/eleven-agents/customization/voice/best-practices/conversational-voice-design#library-voices
 */
export const CURATED_VOICES: VoiceOption[] = [
  { voiceId: "kdmDKE6EkgrWrrykO9Qt", name: "Alexandra" },
  { voiceId: "OYTbf65OHHFELVut7v2H", name: "Hope" },
  { voiceId: "L0Dsvb3SLTyegXwtm47J", name: "Archer" },
  { voiceId: "HDA9tsk27wYi3uq0fPcK", name: "Stuart" },
  { voiceId: "1SM7GgM6IMuvQlz2BwM3", name: "Mark" },
];

export const CURATED_VOICE_IDS = CURATED_VOICES.map((voice) => voice.voiceId);

export const VOICE_PREVIEW_TEXT = "Hi, I'm Orin. This is how I sound.";

const DEFAULT_ORB_COLORS: [string, string] = ["#CADCFC", "#A0B9D1"];

const VOICE_ORB_COLORS: Record<string, [string, string]> = {
  kdmDKE6EkgrWrrykO9Qt: ["#FBB97A", "#F97015"],
  OYTbf65OHHFELVut7v2H: ["#CADCFC", "#A0B9D1"],
  L0Dsvb3SLTyegXwtm47J: ["#BFE9CC", "#79B98C"],
  HDA9tsk27wYi3uq0fPcK: ["#DACDFB", "#A286D6"],
  "1SM7GgM6IMuvQlz2BwM3": ["#FBC5D2", "#E2849E"],
};

export function getVoiceOrbColors(voiceId?: string | null): [string, string] {
  return (voiceId && VOICE_ORB_COLORS[voiceId]) || DEFAULT_ORB_COLORS;
}

export function isCuratedVoiceId(voiceId: string): boolean {
  return CURATED_VOICE_IDS.includes(voiceId);
}

export function normalizeVoiceId(voiceId: string): string {
  return isCuratedVoiceId(voiceId) ? voiceId : CURATED_VOICES[0].voiceId;
}

export function voicePreviewUrl(
  voiceId: string,
  voiceSpeed: VoiceSpeed = DEFAULT_VOICE_SPEED,
): string {
  const params = new URLSearchParams({ voiceId, voiceSpeed });
  return `/api/elevenlabs/voice-preview?${params.toString()}`;
}
