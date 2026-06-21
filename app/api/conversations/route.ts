import { NextResponse } from "next/server";

import {
  createConversation,
  listConversations,
} from "@/lib/ai/conversations";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
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

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      await ensureSessionCookie();
    }

    const conversation = await createConversation({
      skipGreeting: true,
      id,
      initialMessage: message,
    });

    return NextResponse.json(conversation, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    debugError("api/conversations", "create failed", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
