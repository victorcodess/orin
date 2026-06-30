import { NextResponse } from "next/server";

import { deleteUserAccount } from "@/lib/ai/account-data";
import { requireAuthedUser } from "@/lib/auth/require-authed-user";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";

export async function DELETE() {
  try {
    const auth = await requireAuthedUser();

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteUserAccount(auth.user.id);
    await auth.supabase.auth.signOut();

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    debugError("api/account", "DELETE failed", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
