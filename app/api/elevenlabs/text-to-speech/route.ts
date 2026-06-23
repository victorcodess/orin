import { debugLog } from "@/lib/debug";
import { READ_ALOUD_TTS_MODEL } from "@/lib/elevenlabs/tts-config";
import {
  downloadCachedReadAloudAudio,
  getReadAloudOwnerId,
  uploadCachedReadAloudAudio,
} from "@/lib/elevenlabs/read-aloud-storage";

type TextToSpeechRequestBody = {
  text?: string;
  voiceId?: string;
};

export async function POST(req: Request) {
  const startedAt = Date.now();
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey.includes("your-")) {
    return Response.json(
      {
        error:
          "ELEVENLABS_API_KEY is not configured. Set it in .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as TextToSpeechRequestBody | null;
  const text = body?.text?.trim();
  const voiceId = body?.voiceId?.trim();

  if (!text) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  if (!voiceId) {
    return Response.json({ error: "Voice ID is required" }, { status: 400 });
  }

  let ownerId: string | null = null;

  try {
    ownerId = await getReadAloudOwnerId();
    const cachedAudio = await downloadCachedReadAloudAudio({
      ownerId,
      text,
      voiceId,
    });

    if (cachedAudio) {
      debugLog("api/tts", "cache hit", {
        ownerId,
        elapsedMs: Date.now() - startedAt,
      });

      return new Response(cachedAudio, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=31536000, immutable",
          "X-Read-Aloud-Cache": "hit",
        },
      });
    }
  } catch (error) {
    debugLog("api/tts", "cache lookup failed, continuing without cache", error);
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
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
        output_format: "mp3_44100_128",
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return Response.json(
      { error: "Failed to generate speech" },
      { status: response.status }
    );
  }

  const audio = await response.arrayBuffer();

  if (ownerId) {
    try {
      await uploadCachedReadAloudAudio({
        ownerId,
        text,
        voiceId,
        audio,
      });
      debugLog("api/tts", "cache stored", {
        ownerId,
        elapsedMs: Date.now() - startedAt,
      });
    } catch (error) {
      debugLog("api/tts", "cache store failed", error);
    }
  }

  return new Response(audio, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Read-Aloud-Cache": "miss",
    },
  });
}
