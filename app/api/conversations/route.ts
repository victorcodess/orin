import { NextResponse } from "next/server";

import {
  createConversation,
  listConversations,
} from "@/lib/ai/conversations";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { getQuotaContext } from "@/lib/quotas/context";
import { isQuotaBlockedError, quotaBlockedResponse } from "@/lib/quotas/errors";
import { assertQuotaAllowed, resolveOpenAIKey } from "@/lib/quotas/resolve";
import { ensureSessionCookie } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const conversations = await listConversations();
    return NextResponse.json(conversations, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    debugError("api/conversations", "list failed", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { message?: string; id?: string };
    const message = body.message?.trim();
    const id = body.id?.trim() || undefined;

    if (!message && !id) {
      return NextResponse.json(
        { error: "message or id is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      await ensureSessionCookie();
    }

    const quotaCtx = await getQuotaContext();
    if (message) {
      await resolveOpenAIKey(quotaCtx, "new_conversation");
    } else {
      await assertQuotaAllowed(quotaCtx, "voice_session");
      await assertQuotaAllowed(quotaCtx, "new_conversation");
    }

    const conversation = await createConversation({
      id,
      initialMessage: message,
    });

    return NextResponse.json(conversation, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    debugError("api/conversations", "create failed", error);

    if (isQuotaBlockedError(error)) {
      return quotaBlockedResponse(error);
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
