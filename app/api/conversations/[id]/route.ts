import { NextResponse } from "next/server";

import {
  deleteConversation,
  updateConversationFavorite,
  updateConversationTitle,
} from "@/lib/ai/conversations";
import { loadConversationData } from "@/lib/ai/load-conversation";
import { debugError } from "@/lib/debug";
import { getErrorMessage, isValidUuid } from "@/lib/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: "Invalid conversation id" }, { status: 400 });
    }

    const data = await loadConversationData(id);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (message === "Conversation not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    debugError("api/conversations/[id]", "load failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const body = (await req.json()) as {
      title?: string;
      is_favorited?: boolean;
    };

    if (typeof body.title === "string") {
      const conversation = await updateConversationTitle(id, body.title);

      return NextResponse.json(conversation, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (typeof body.is_favorited === "boolean") {
      const conversation = await updateConversationFavorite(id, body.is_favorited);

      return NextResponse.json(conversation, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(
      { error: "title or is_favorited is required" },
      { status: 400 },
    );
  } catch (error) {
    const message = getErrorMessage(error);

    if (message === "Conversation not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (message === "Forbidden") {
      return NextResponse.json({ error: message }, { status: 403 });
    }

    debugError("api/conversations/[id]", "update failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
