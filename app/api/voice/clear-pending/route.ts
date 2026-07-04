import { clearVoiceSession } from "@/lib/voice/conversation-binding";
import { getErrorMessage } from "@/lib/errors";

type VoiceClearPendingRequest = {
  conversationId?: string;
  pendingToken?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VoiceClearPendingRequest;
    const { conversationId, pendingToken } = body;

    if (!conversationId || !pendingToken) {
      return Response.json(
        { error: "conversationId and pendingToken are required" },
        { status: 400 },
      );
    }

    await clearVoiceSession(conversationId, { pendingToken });

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {

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
