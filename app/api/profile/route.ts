import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

type ProfilePayload = {
  displayName?: string;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return Response.json({ profile: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, credits_balance")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Response.json(
      {
        profile: {
          displayName:
            data?.display_name ??
            (authData.user.user_metadata?.full_name as string | undefined) ??
            authData.user.email?.split("@")[0] ??
            "User",
          email: authData.user.email ?? "",
          creditsBalance: data?.credits_balance ?? 0,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    debugError("api/profile", "GET failed", error);
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as ProfilePayload;
    const displayName = body.displayName?.trim();

    if (!displayName || displayName.length > 64) {
      return Response.json({ error: "Invalid display name" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", authData.user.id);

    if (error) {
      throw error;
    }

    return Response.json(
      {
        profile: {
          displayName,
          email: authData.user.email ?? "",
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    debugError("api/profile", "PATCH failed", error);
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
