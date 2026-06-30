import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { getQuotaContext } from "@/lib/quotas/context";
import { buildQuotaUsageSummary } from "@/lib/quotas/usage-summary";

export async function GET() {
  try {
    const ctx = await getQuotaContext();
    const usage = await buildQuotaUsageSummary(ctx);

    return Response.json({ usage }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    debugError("api/usage", "GET failed", error);
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
