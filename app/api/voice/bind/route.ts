import { normalizeTimeZone } from "@/lib/prompt-context/runtime";
import { bindVoiceSession } from "@/lib/voice/conversation-binding";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import type { ClientPromptContext } from "@/lib/prompt-context/client";

type VoiceBindRequest = {
  conversationId?: string;
  pendingToken?: string;
  voiceSessionId?: string;
  promptContext?: ClientPromptContext;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VoiceBindRequest;
    const { conversationId, pendingToken, voiceSessionId } = body;

    if (!conversationId || !pendingToken || !voiceSessionId) {
      return Response.json(
        { error: "conversationId, pendingToken, and voiceSessionId are required" },
        { status: 400 },
      );
    }

    await bindVoiceSession({
      conversationId,
      pendingToken,
      voiceSessionId,
      timeZone: normalizeTimeZone(body.promptContext?.timeZone),
    });

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    debugError("api/voice/bind", "request failed", error);

    const message = getErrorMessage(error);
    const status =
      message === "Forbidden"
        ? 403
        : message === "Conversation not found" ||
            message === "Voice session binding expired or invalid"
          ? 404
          : 500;

    return Response.json({ error: message }, { status });
  }
}
