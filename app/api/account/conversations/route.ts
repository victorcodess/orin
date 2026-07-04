import { NextResponse } from "next/server";

import { deleteAllUserConversations } from "@/lib/ai/account-data";
import { requireAuthedUser } from "@/lib/auth/require-authed-user";
import { getErrorMessage } from "@/lib/errors";

export async function DELETE() {
  try {
    const auth = await requireAuthedUser();

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deletedCount = await deleteAllUserConversations(auth.user.id);

    return NextResponse.json(
      { deletedCount },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
