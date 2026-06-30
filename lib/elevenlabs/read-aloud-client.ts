import type { VoiceSpeed } from "@/lib/orin/voice/speed";
import { readErrorResponse } from "@/lib/quotas/client-errors";

export async function fetchReadAloudAudio(
  text: string,
  voiceId: string,
  voiceSpeed: VoiceSpeed,
): Promise<string> {
  const response = await fetch("/api/elevenlabs/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId, voiceSpeed }),
  });

  if (!response.ok) {
    throw await readErrorResponse(response);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
