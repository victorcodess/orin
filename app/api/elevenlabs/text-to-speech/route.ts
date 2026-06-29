import { debugLog } from "@/lib/debug";
import { synthesizeSpeech } from "@/lib/elevenlabs/synthesize-speech";
import {
  downloadCachedReadAloudAudio,
  getReadAloudOwnerId,
  uploadCachedReadAloudAudio,
} from "@/lib/elevenlabs/read-aloud-storage";
import { parseVoiceSpeed, voiceSpeedToNumber } from "@/lib/orin/voice/speed";

type TextToSpeechRequestBody = {
  text?: string;
  voiceId?: string;
  voiceSpeed?: string;
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
  const voiceSpeed = parseVoiceSpeed(body?.voiceSpeed);
  const speed = voiceSpeedToNumber(voiceSpeed);

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
      voiceSpeed,
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

  const response = await synthesizeSpeech(apiKey, {
    voiceId,
    text,
    speed,
  }).catch(() => null);

  if (!response) {
    return Response.json(
      { error: "Failed to generate speech" },
      { status: 502 },
    );
  }

  const audio = response;

  if (ownerId) {
    try {
      await uploadCachedReadAloudAudio({
        ownerId,
        text,
        voiceId,
        voiceSpeed,
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
