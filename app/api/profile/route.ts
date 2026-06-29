import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import {
  DEFAULT_USER_PREFERENCES,
  isMessageBubbleLayout,
  isThemePreference,
} from "@/lib/orin/user-preferences";
import { createClient } from "@/lib/supabase/server";

type ProfilePayload = {
  displayName?: string;
  theme?: string;
  language?: string;
  messageBubbleLayout?: string;
};

function mapProfileRow(
  row: {
    display_name: string | null;
    credits_balance: number;
    theme: string;
    language: string;
    message_bubble_layout: string;
  } | null,
  email: string,
  fallbackName: string,
) {
  const theme = row?.theme ?? DEFAULT_USER_PREFERENCES.theme;
  const language = row?.language ?? DEFAULT_USER_PREFERENCES.language;
  const messageBubbleLayout =
    row?.message_bubble_layout ?? DEFAULT_USER_PREFERENCES.messageBubbleLayout;

  return {
    displayName: row?.display_name ?? fallbackName,
    email,
    creditsBalance: row?.credits_balance ?? 0,
    theme: isThemePreference(theme) ? theme : DEFAULT_USER_PREFERENCES.theme,
    language,
    messageBubbleLayout: isMessageBubbleLayout(messageBubbleLayout)
      ? messageBubbleLayout
      : DEFAULT_USER_PREFERENCES.messageBubbleLayout,
  };
}

function fallbackName(authUser: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  return (
    (authUser.user_metadata?.full_name as string | undefined) ??
    authUser.email?.split("@")[0] ??
    "User"
  );
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      return Response.json({ profile: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "display_name, credits_balance, theme, language, message_bubble_layout",
      )
      .eq("id", authData.user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Response.json(
      {
        profile: mapProfileRow(
          data,
          authData.user.email ?? "",
          fallbackName(authData.user),
        ),
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
    const updates: {
      display_name?: string;
      theme?: string;
      language?: string;
      message_bubble_layout?: string;
    } = {};

    if (body.displayName !== undefined) {
      const displayName = body.displayName.trim();

      if (!displayName || displayName.length > 64) {
        return Response.json({ error: "Invalid display name" }, { status: 400 });
      }

      updates.display_name = displayName;
    }

    if (body.theme !== undefined) {
      if (!isThemePreference(body.theme)) {
        return Response.json({ error: "Invalid theme" }, { status: 400 });
      }

      updates.theme = body.theme;
    }

    if (body.language !== undefined) {
      const language = body.language.trim();

      if (!language || language.length > 16) {
        return Response.json({ error: "Invalid language" }, { status: 400 });
      }

      updates.language = language;
    }

    if (body.messageBubbleLayout !== undefined) {
      if (!isMessageBubbleLayout(body.messageBubbleLayout)) {
        return Response.json({ error: "Invalid chat bubble layout" }, { status: 400 });
      }

      updates.message_bubble_layout = body.messageBubbleLayout;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No changes provided" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", authData.user.id);

    if (error) {
      throw error;
    }

    const { data, error: readError } = await supabase
      .from("profiles")
      .select(
        "display_name, credits_balance, theme, language, message_bubble_layout",
      )
      .eq("id", authData.user.id)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    return Response.json(
      {
        profile: mapProfileRow(
          data,
          authData.user.email ?? "",
          fallbackName(authData.user),
        ),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    debugError("api/profile", "PATCH failed", error);
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
