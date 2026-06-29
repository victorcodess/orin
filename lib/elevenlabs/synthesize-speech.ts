import { debugError } from "@/lib/debug";
import { READ_ALOUD_TTS_MODEL } from "@/lib/elevenlabs/tts-config";

const READ_ALOUD_MAX_CHARS = 40_000;

export class TtsSynthesisError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "TtsSynthesisError";
    this.status = status;
    this.code = code;
  }
}

function ttsErrorFromResponse(status: number, body: string): TtsSynthesisError {
  try {
    const parsed = JSON.parse(body) as {
      detail?: { code?: string; message?: string };
    };
    const code = parsed.detail?.code;
    const message = parsed.detail?.message;

    if (code === "quota_exceeded") {
      return new TtsSynthesisError(
        "Out of ElevenLabs credits. Add credits in your ElevenLabs account to use read aloud.",
        402,
        code,
      );
    }

    if (message) {
      return new TtsSynthesisError(message, status >= 400 ? status : 502, code);
    }
  } catch {
    // Ignore malformed error bodies.
  }

  return new TtsSynthesisError(`TTS request failed (${status})`, status);
}

export function ttsErrorResponse(error: unknown) {
  if (error instanceof TtsSynthesisError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  return Response.json(
    { error: "Failed to generate speech" },
    { status: 502 },
  );
}

/** Strip markdown and collapse whitespace so TTS reads naturally. */
export function prepareReadAloudText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/_{1,3}([^_]+)_{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, READ_ALOUD_MAX_CHARS)
    .trim();
}

export async function synthesizeSpeech(
  apiKey: string,
  {
    voiceId,
    text,
    speed,
    modelId = READ_ALOUD_TTS_MODEL,
  }: {
    voiceId: string;
    text: string;
    speed: number;
    modelId?: string;
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
        model_id: modelId,
        voice_settings: { speed },
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    debugError("elevenlabs/synthesize-speech", "TTS failed", {
      status: response.status,
      modelId,
      textLength: text.length,
      detail: detail.slice(0, 300),
    });
    throw ttsErrorFromResponse(response.status, detail);
  }

  return response.arrayBuffer();
}
