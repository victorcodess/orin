import { debugLog, debugError } from "@/lib/debug";
import {
  prepareReadAloudText,
  synthesizeSpeech,
  ttsErrorResponse,
} from "@/lib/elevenlabs/synthesize-speech";
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
  const rawText = body?.text?.trim();
  const voiceId = body?.voiceId?.trim();
  const voiceSpeed = parseVoiceSpeed(body?.voiceSpeed);
  const speed = voiceSpeedToNumber(voiceSpeed);

  if (!rawText) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  const text = prepareReadAloudText(rawText);

  if (!text) {
    return Response.json({ error: "Nothing to read aloud" }, { status: 400 });
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

  let audio: ArrayBuffer;

  try {
    audio = await synthesizeSpeech(apiKey, {
      voiceId,
      text,
      speed,
    });
  } catch (error) {
    debugError("api/tts", "synthesis failed", error);
    return ttsErrorResponse(error);
  }

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
