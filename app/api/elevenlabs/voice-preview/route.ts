import { debugError } from "@/lib/debug";
import { synthesizeSpeech } from "@/lib/elevenlabs/synthesize-speech";
import {
  isCuratedVoiceId,
  VOICE_PREVIEW_TEXT,
} from "@/lib/elevenlabs/voices";
import { parseVoiceSpeed, voiceSpeedToNumber } from "@/lib/orin/voice/speed";

const previewCache = new Map<string, { audio: ArrayBuffer; at: number }>();
const PREVIEW_CACHE_TTL_MS = 1000 * 60 * 60;

function getElevenLabsApiKey() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey.includes("your-")) {
    return null;
  }

  return apiKey;
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const voiceId = params.get("voiceId")?.trim();
  const voiceSpeed = parseVoiceSpeed(params.get("voiceSpeed"));
  const speed = voiceSpeedToNumber(voiceSpeed);

  if (!voiceId) {
    return Response.json({ error: "voiceId is required" }, { status: 400 });
  }

  if (!isCuratedVoiceId(voiceId)) {
    return Response.json({ error: "Unknown voice" }, { status: 400 });
  }

  const apiKey = getElevenLabsApiKey();

  if (!apiKey) {
    return Response.json(
      { error: "ELEVENLABS_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const cacheKey = `${voiceId}:${voiceSpeed}`;
  const cached = previewCache.get(cacheKey);

  if (cached && Date.now() - cached.at < PREVIEW_CACHE_TTL_MS) {
    return new Response(cached.audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  try {
    const audio = await synthesizeSpeech(apiKey, {
      voiceId,
      text: VOICE_PREVIEW_TEXT,
      speed,
    });

    previewCache.set(cacheKey, { audio, at: Date.now() });

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    debugError("api/elevenlabs/voice-preview", "GET failed", error);
    return Response.json(
      { error: "Failed to generate voice preview" },
      { status: 500 },
    );
  }
}
