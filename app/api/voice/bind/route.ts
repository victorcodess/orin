import { bindVoiceSession } from "@/lib/voice/conversation-binding";
import { getErrorMessage } from "@/lib/errors";

type VoiceBindRequest = {
  conversationId?: string;
  pendingToken?: string;
  voiceSessionId?: string;
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

    await bindVoiceSession({ conversationId, pendingToken, voiceSessionId });

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {

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
