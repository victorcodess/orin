import { READ_ALOUD_TTS_MODEL } from "@/lib/elevenlabs/tts-config";

export async function synthesizeSpeech(
  apiKey: string,
  {
    voiceId,
    text,
    speed,
  }: {
    voiceId: string;
    text: string;
    speed: number;
  },
): Promise<ArrayBuffer> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: READ_ALOUD_TTS_MODEL,
        voice_settings: { speed },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`TTS request failed (${response.status})`);
  }

  return response.arrayBuffer();
}
