import { NextResponse } from "next/server";

import { exportUserAccountData } from "@/lib/ai/account-data";
import { requireAuthedUser } from "@/lib/auth/require-authed-user";
import { getErrorMessage } from "@/lib/errors";

export async function GET() {
  try {
    const auth = await requireAuthedUser();

    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await exportUserAccountData(
      auth.user.id,
      auth.user.email ?? "",
    );

    const filename = `orin-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
