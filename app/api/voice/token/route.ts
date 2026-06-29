import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import { verifyConversationAccess } from "@/lib/ai/conversations";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { markVoiceCallPending } from "@/lib/voice/conversation-binding";

type VoiceTokenRequest = {
  conversationId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VoiceTokenRequest;
    const { conversationId } = body;

    if (!conversationId) {
      return Response.json({ error: "conversationId is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;

    if (!apiKey || apiKey.includes("your-")) {
      return Response.json(
        {
          error:
            "ELEVENLABS_API_KEY is not configured. Set it in .env.local and restart the dev server.",
        },
        { status: 500 },
      );
    }

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

    const pendingToken = await markVoiceCallPending(conversationId);

    const elevenlabs = new ElevenLabsClient({ apiKey });
    const [{ token }, speechEngine] = await Promise.all([
      elevenlabs.conversationalAi.conversations.getWebrtcToken({
        agentId: engineId,
      }),
      elevenlabs.speechEngine.get(engineId).catch(() => null),
    ]);

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

    const message = getErrorMessage(error);
    const status =
      message === "Forbidden"
        ? 403
        : message === "Conversation not found"
          ? 404
          : 500;

    return Response.json({ error: message }, { status });
  }
}
