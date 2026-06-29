export type VoiceSpeed = "slow" | "normal" | "fast";

export const DEFAULT_VOICE_SPEED: VoiceSpeed = "normal";

export const VOICE_SPEED_OPTIONS: { value: VoiceSpeed; label: string }[] = [
  { value: "slow", label: "Slow" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Fast" },
];

const VOICE_SPEED_VALUES: VoiceSpeed[] = ["slow", "normal", "fast"];

/** ElevenLabs accepts 0.7–1.2; see speed control docs. */
export function voiceSpeedToNumber(speed: VoiceSpeed): number {
  switch (speed) {
    case "slow":
      return 0.85;
    case "fast":
      return 1.15;
    default:
      return 1;
  }
}

export function parseVoiceSpeed(value: unknown): VoiceSpeed {
  if (typeof value === "string" && VOICE_SPEED_VALUES.includes(value as VoiceSpeed)) {
    return value as VoiceSpeed;
  }

  return DEFAULT_VOICE_SPEED;
}
