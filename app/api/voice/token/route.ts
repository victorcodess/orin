import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import { getAssistantConfig } from "@/lib/ai/assistant-config";
import { verifyConversationAccess } from "@/lib/ai/conversations";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { getQuotaContext } from "@/lib/quotas/context";
import { isQuotaBlockedError, quotaBlockedResponse } from "@/lib/quotas/errors";
import { recordUsageEvent } from "@/lib/quotas/record";
import { resolveElevenLabsKey } from "@/lib/quotas/resolve";
import {
  clearVoiceSession,
  markVoiceCallPending,
} from "@/lib/voice/conversation-binding";
import { syncSpeechEngineTts } from "@/lib/voice/speech-engine-config";
import { createClient } from "@/lib/supabase/server";

type VoiceTokenRequest = {
  conversationId?: string;
};

function voiceTokenError(error: unknown): {
  message: string;
  status: number;
  code?: string;
} {
  const raw = error instanceof Error ? error.message : String(error);
  const bodyMatch = raw.match(/Body:\s*(\{[\s\S]*\})/);

  if (bodyMatch) {
    try {
      const detail = (
        JSON.parse(bodyMatch[1]) as {
          detail?: { code?: string; message?: string };
        }
      ).detail;

      if (detail?.code === "concurrent_limit_exceeded") {
        return {
          message:
            "ElevenLabs voice capacity is full. End any open calls, wait a minute, and try again.",
          status: 429,
          code: detail.code,
        };
      }

      if (detail?.code === "quota_exceeded") {
        return {
          message:
            "Out of ElevenLabs credits. Add credits in your ElevenLabs account or add your API key in Settings.",
          status: 402,
          code: detail.code,
        };
      }

      if (detail?.message) {
        return {
          message: detail.message,
          status: raw.includes("Status code: 429") ? 429 : 502,
          code: detail.code,
        };
      }
    } catch {
      // Ignore malformed error bodies.
    }
  }

  if (raw.includes("Status code: 429")) {
    return {
      message: "ElevenLabs rate limit reached. Wait a moment and try again.",
      status: 429,
    };
  }

  return {
    message:
      error instanceof Error ? error.message : "Failed to start voice call",
    status: 502,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VoiceTokenRequest;
    const { conversationId } = body;

    if (!conversationId) {
      return Response.json({ error: "conversationId is required" }, { status: 400 });
    }

    const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;

    if (!engineId || engineId.includes("your-")) {
      return Response.json(
        {
          error:
            "ELEVENLABS_SPEECH_ENGINE_ID is not configured. Create a Speech Engine resource and set the id in .env.local.",
        },
        { status: 500 },
      );
    }

    await verifyConversationAccess(conversationId);

    const quotaCtx = await getQuotaContext();
    const elevenlabsResolved = await resolveElevenLabsKey(
      quotaCtx,
      "voice_session",
    );

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const assistantConfig = await getAssistantConfig(authData.user?.id);
    await syncSpeechEngineTts(assistantConfig, elevenlabsResolved.key);

    const pendingToken = await markVoiceCallPending(conversationId);

    const elevenlabs = new ElevenLabsClient({ apiKey: elevenlabsResolved.key });
    let token: string;
    let speechEngine;

    try {
      [{ token }, speechEngine] = await Promise.all([
        elevenlabs.conversationalAi.conversations.getWebrtcToken({
          agentId: engineId,
        }),
        elevenlabs.speechEngine.get(engineId).catch(() => null),
      ]);
    } catch (error) {
      await clearVoiceSession(conversationId, pendingToken).catch(() => {});
      throw error;
    }

    await recordUsageEvent({
      ctx: quotaCtx,
      type: "voice_minutes",
      conversationId,
    });

    const turn = speechEngine?.config?.turn;
    const silenceEndCallTimeout =
      turn?.silenceEndCallTimeout != null && turn.silenceEndCallTimeout > 0
        ? turn.silenceEndCallTimeout
        : null;

    return Response.json(
      {
        token,
        pendingToken,
        silenceEndCallTimeout,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    debugError("api/voice/token", "request failed", error);

    if (isQuotaBlockedError(error)) {
      return quotaBlockedResponse(error);
    }

    const message = getErrorMessage(error);
    if (message === "Forbidden") {
      return Response.json({ error: message }, { status: 403 });
    }
    if (message === "Conversation not found") {
      return Response.json({ error: message }, { status: 404 });
    }

    const parsed = voiceTokenError(error);
    return Response.json(
      { error: parsed.message, code: parsed.code },
      { status: parsed.status },
    );
  }
}
