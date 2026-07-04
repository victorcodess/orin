import { READ_ALOUD_TTS_MODEL } from "@/lib/ai/model";

/** v3 models cap around 5k chars per request. */
const READ_ALOUD_MAX_CHARS = 5_000;

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

    if (code === "model_access_denied") {
      return new TtsSynthesisError(
        "This voice model is not available for read aloud.",
        403,
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
    .trim();
}

function chunkReadAloudText(text: string, maxLength = READ_ALOUD_MAX_CHARS) {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    let splitAt = remaining.lastIndexOf(". ", maxLength);
    if (splitAt < maxLength * 0.5) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }
    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks.filter(Boolean);
}

async function synthesizeSpeechChunk(
  apiKey: string,
  {
    voiceId,
    text,
    speed,
    modelId,
  }: {
    voiceId: string;
    text: string;
    speed: number;
    modelId: string;
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
    throw ttsErrorFromResponse(response.status, detail);
  }

  return response.arrayBuffer();
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
  const chunks = chunkReadAloudText(text);

  if (chunks.length === 1) {
    return synthesizeSpeechChunk(apiKey, {
      voiceId,
      text: chunks[0],
      speed,
      modelId,
    });
  }

  const audioChunks = await Promise.all(
    chunks.map((chunk) =>
      synthesizeSpeechChunk(apiKey, { voiceId, text: chunk, speed, modelId }),
    ),
  );

  const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of audioChunks) {
    combined.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }

  return combined.buffer;
}
