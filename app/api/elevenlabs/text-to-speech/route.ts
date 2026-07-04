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
import { getErrorMessage } from "@/lib/errors";
import { getQuotaContext } from "@/lib/quotas/context";
import { isQuotaBlockedError, quotaBlockedResponse } from "@/lib/quotas/errors";
import { recordUsageEvent } from "@/lib/quotas/record";
import { resolveElevenLabsKey } from "@/lib/quotas/resolve";
import { parseVoiceSpeed, voiceSpeedToNumber } from "@/lib/orin/voice/speed";

type TextToSpeechRequestBody = {
  text?: string;
  voiceId?: string;
  voiceSpeed?: string;
};

export async function POST(req: Request) {
  try {
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

    const quotaCtx = await getQuotaContext();
    const elevenlabsResolved = await resolveElevenLabsKey(quotaCtx, "read_aloud");

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

        return new Response(cachedAudio, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "private, max-age=31536000, immutable",
            "X-Read-Aloud-Cache": "hit",
          },
        });
      }
    } catch {
    }

    let audio: ArrayBuffer;

    try {
      audio = await synthesizeSpeech(elevenlabsResolved.key, {
        voiceId,
        text,
        speed,
      });
    } catch (error) {
      return ttsErrorResponse(error);
    }

    await recordUsageEvent({
      ctx: quotaCtx,
      type: "tts_chars",
      source: elevenlabsResolved.source,
    });

    if (ownerId) {
      try {
        await uploadCachedReadAloudAudio({
          ownerId,
          text,
          voiceId,
          voiceSpeed,
          audio,
        });
      } catch {
      }
    }

    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=31536000, immutable",
        "X-Read-Aloud-Cache": "miss",
      },
    });
  } catch (error) {

    if (isQuotaBlockedError(error)) {
      return quotaBlockedResponse(error);
    }

    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
