export type VoiceOption = {
  voiceId: string;
  name: string;
  previewUrl: string | null;
  category: string | null;
  labels: Record<string, string>;
};

/**
 * The curated set of voices Orin offers, in display order. The first entry is
 * Orin's default. Each voice gets a distinct orb gradient (brand orange for the
 * default). Keeping the set small means the picker can use the WebGL orbs
 * without exhausting the browser's WebGL context limit.
 */
export const CURATED_VOICE_IDS = [
  "TyAD2ntJFdDReoa55SLn", // Orin (default)
  "EXAVITQu4vr4xnSDxMaL", // Sarah
  "JBFqnCBsd6RMkjVDRZzb", // George
  "Xb7hH8MSUJpSbSDYk0k2", // Alice
  "N2lVS1w4EtoT3dr4eOWO", // Callum
] as const;

const DEFAULT_ORB_COLORS: [string, string] = ["#CADCFC", "#A0B9D1"];

const VOICE_ORB_COLORS: Record<string, [string, string]> = {
  TyAD2ntJFdDReoa55SLn: ["#FBB97A", "#F97015"], // brand orange
  EXAVITQu4vr4xnSDxMaL: ["#CADCFC", "#A0B9D1"], // blue
  JBFqnCBsd6RMkjVDRZzb: ["#BFE9CC", "#79B98C"], // green
  Xb7hH8MSUJpSbSDYk0k2: ["#DACDFB", "#A286D6"], // purple
  N2lVS1w4EtoT3dr4eOWO: ["#FBC5D2", "#E2849E"], // rose
};

export function getVoiceOrbColors(voiceId?: string | null): [string, string] {
  return (voiceId && VOICE_ORB_COLORS[voiceId]) || DEFAULT_ORB_COLORS;
}

/**
 * Curated voices used when the live `/v1/voices` call is unavailable — e.g. the
 * API key is missing the `voices_read` permission — so the picker stays usable.
 */
export const FALLBACK_VOICES: VoiceOption[] = [
  { voiceId: "TyAD2ntJFdDReoa55SLn", name: "Orin", previewUrl: null, category: "default", labels: {} },
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", previewUrl: null, category: "premade", labels: {} },
  { voiceId: "JBFqnCBsd6RMkjVDRZzb", name: "George", previewUrl: null, category: "premade", labels: {} },
  { voiceId: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", previewUrl: null, category: "premade", labels: {} },
  { voiceId: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", previewUrl: null, category: "premade", labels: {} },
];
