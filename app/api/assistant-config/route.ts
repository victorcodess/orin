import {
  clearAssistantConfigCookie,
  getAssistantConfig,
  setAssistantConfigCookie,
} from "@/lib/ai/assistant-config";
import { DEFAULT_ASSISTANT, type AssistantConfig } from "@/lib/orin/defaults";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AssistantConfigPayload = {
  personality?: string;
  voiceId?: string;
};

function sanitizeConfig(payload: AssistantConfigPayload): AssistantConfig | null {
  const personality = payload.personality?.trim();
  const voiceId = payload.voiceId?.trim();

  if (!personality || personality.length > 4000) {
    return null;
  }

  if (!voiceId || voiceId.length > 64) {
    return null;
  }

  return {
    name: DEFAULT_ASSISTANT.name,
    personality,
    voiceId,
    firstMessage: DEFAULT_ASSISTANT.firstMessage,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const config = await getAssistantConfig(authData.user?.id);

    return Response.json(
      {
        config,
        isDefault: JSON.stringify(config) === JSON.stringify(DEFAULT_ASSISTANT),
        persisted: Boolean(authData.user),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    debugError("api/assistant-config", "GET failed", error);
    return Response.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as AssistantConfigPayload;
    const config = sanitizeConfig(body);

    if (!config) {
      return Response.json({ error: "Invalid assistant config" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (authData.user) {
      const admin = createAdminClient();
      const { error } = await admin.from("assistant_configs").upsert(
        {
          user_id: authData.user.id,
          name: config.name,
          personality: config.personality,
          voice_id: config.voiceId,
          first_message: config.firstMessage,
          is_default: false,
        },
        { onConflict: "user_id" },
      );

      if (error) {
        throw error;
      }

      await clearAssistantConfigCookie();
    } else {
      await setAssistantConfigCookie(config);
    }

    return Response.json(
      {
        config,
        persisted: Boolean(authData.user),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    debugError("api/assistant-config", "PATCH failed", error);
    return Response.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (authData.user) {
      const admin = createAdminClient();
      await admin
        .from("assistant_configs")
        .delete()
        .eq("user_id", authData.user.id);
    }

    await clearAssistantConfigCookie();

    return Response.json(
      { config: DEFAULT_ASSISTANT },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    debugError("api/assistant-config", "DELETE failed", error);
    return Response.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
