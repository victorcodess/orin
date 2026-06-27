import { debugError } from "@/lib/debug";
import {
  CURATED_VOICE_IDS,
  FALLBACK_VOICES,
  type VoiceOption,
} from "@/lib/elevenlabs/voices";

type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  preview_url?: string | null;
  category?: string | null;
  labels?: Record<string, string>;
};

type ElevenLabsVoicesResponse = {
  voices?: ElevenLabsVoice[];
};

let cachedVoices: VoiceOption[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 1000 * 60 * 60;

function fallbackResponse(reason: string) {
  return Response.json(
    { voices: FALLBACK_VOICES, fallback: true, reason },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey || apiKey.includes("your-")) {
      return fallbackResponse("ELEVENLABS_API_KEY is not configured");
    }

    const now = Date.now();

    if (cachedVoices && now - cachedAt < CACHE_TTL_MS) {
      return Response.json(
        { voices: cachedVoices },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": apiKey,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      // 401 here is typically the API key missing the `voices_read` permission.
      // Keep the picker usable with a curated fallback instead of erroring.
      debugError(
        "api/elevenlabs/voices",
        `voices fetch returned ${response.status}`,
      );
      return fallbackResponse(
        response.status === 401
          ? "API key is missing the voices_read permission"
          : `Voices API returned ${response.status}`,
      );
    }

    const data = (await response.json()) as ElevenLabsVoicesResponse;
    const all = (data.voices ?? []).map((voice) => ({
      voiceId: voice.voice_id,
      name: voice.name,
      previewUrl: voice.preview_url ?? null,
      category: voice.category ?? null,
      labels: voice.labels ?? {},
    }));

    // Restrict to the curated set (in curated order). If some curated voices
    // aren't in the account, pad with other voices so we still show up to 5.
    const curatedIds = new Set<string>(CURATED_VOICE_IDS);
    const byId = new Map(all.map((voice) => [voice.voiceId, voice]));
    const curated = CURATED_VOICE_IDS.map((id) => byId.get(id)).filter(
      (voice): voice is VoiceOption => Boolean(voice),
    );
    const extras = all
      .filter((voice) => !curatedIds.has(voice.voiceId))
      .sort((a, b) => a.name.localeCompare(b.name));
    const voices = [...curated, ...extras].slice(0, 5);

    cachedVoices = voices;
    cachedAt = now;

    return Response.json(
      { voices },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    debugError("api/elevenlabs/voices", "GET failed", error);
    return fallbackResponse("Could not reach the voices service");
  }
}
