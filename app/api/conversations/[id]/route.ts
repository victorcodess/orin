import { NextResponse } from "next/server";

import {
  deleteConversation,
  updateConversationTitle,
} from "@/lib/ai/conversations";
import { debugError } from "@/lib/debug";
import { getErrorMessage, isValidUuid } from "@/lib/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    await deleteConversation(id);

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message === "Conversation not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    debugError("api/conversations/[id]", "delete failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const body = (await req.json()) as { title?: string };

    if (typeof body.title !== "string") {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const conversation = await updateConversationTitle(id, body.title);

    return NextResponse.json(conversation, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message === "Conversation not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    debugError("api/conversations/[id]", "update title failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
