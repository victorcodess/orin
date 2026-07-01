import { verifyConversationAccess } from "@/lib/ai/conversations";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { getQuotaContext } from "@/lib/quotas/context";
import { billVoiceMinutes } from "@/lib/quotas/limits";
import {
  hasRecentVoiceComplete,
  recordUsageEvent,
} from "@/lib/quotas/record";
import type { KeySource } from "@/lib/quotas/types";
import { clearVoiceSession } from "@/lib/voice/conversation-binding";

type VoiceCompleteRequest = {
  conversationId?: string;
  durationSeconds?: number;
  keySource?: KeySource;
  voiceSessionId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VoiceCompleteRequest;
    const conversationId = body.conversationId?.trim();
    const durationSeconds = body.durationSeconds;
    const keySource = body.keySource ?? "platform";

    if (!conversationId || durationSeconds == null || durationSeconds < 0) {
      return Response.json(
        { error: "conversationId and durationSeconds are required" },
        { status: 400 },
      );
    }

    await verifyConversationAccess(conversationId);

    const billedMinutes = billVoiceMinutes(durationSeconds);

    if (
      billedMinutes > 0 &&
      !(await hasRecentVoiceComplete(conversationId))
    ) {
      const quotaCtx = await getQuotaContext();
      await recordUsageEvent({
        ctx: quotaCtx,
        type: "voice_minutes",
        source: keySource,
        conversationId,
        amount: billedMinutes,
      });
    }

    const voiceSessionId = body.voiceSessionId?.trim();
    if (voiceSessionId) {
      await clearVoiceSession(conversationId, { voiceSessionId });
    }

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    debugError("api/voice/complete", "request failed", error);

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
