import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import {
  clearAssistantConfigCookie,
  getAssistantConfig,
  setAssistantConfigCookie,
} from "@/lib/ai/assistant-config";
import { DEFAULT_ASSISTANT, type AssistantConfig } from "@/lib/orin/defaults";
import { buildPersonalityPrompt } from "@/lib/orin/personality/prompts";
import { personalitySettingsEqual, parsePersonalitySettings } from "@/lib/orin/personality/parse";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { buildSpeechEngineTtsConfig } from "@/lib/voice/speech-engine-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PersonalitySettings } from "@/lib/orin/personality/types";

type AssistantConfigPayload = {
  personalitySettings?: PersonalitySettings;
  voiceId?: string;
};

function sanitizeConfig(payload: AssistantConfigPayload): AssistantConfig | null {
  const voiceId = payload.voiceId?.trim();

  if (!voiceId || voiceId.length > 64) {
    return null;
  }

  if (!payload.personalitySettings) {
    return null;
  }

  const personalitySettings = parsePersonalitySettings(payload.personalitySettings);

  return {
    personalitySettings,
    voiceId,
  };
}

function isDefaultConfig(config: AssistantConfig) {
  return (
    config.voiceId === DEFAULT_ASSISTANT.voiceId &&
    personalitySettingsEqual(
      config.personalitySettings,
      DEFAULT_ASSISTANT.personalitySettings,
    )
  );
}

async function syncSpeechEngineVoice(voiceId: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;

  if (!apiKey || apiKey.includes("your-") || !engineId || engineId.includes("your-")) {
    return;
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const engine = await elevenlabs.speechEngine.get(engineId);
    const currentVoiceId = engine.config?.tts?.voiceId;

    if (currentVoiceId === voiceId) {
      return;
    }

    await elevenlabs.speechEngine.update(engineId, {
      tts: buildSpeechEngineTtsConfig(voiceId),
    });
  } catch (error) {
    debugError("api/assistant-config", "failed to sync speech engine voice", error);
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const config = await getAssistantConfig(authData.user?.id);

    return Response.json(
      {
        config,
        isDefault: isDefaultConfig(config),
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
    const previousConfig = await getAssistantConfig(authData.user?.id);

    if (authData.user) {
      const admin = createAdminClient();
      const { error } = await admin.from("assistant_configs").upsert(
        {
          user_id: authData.user.id,
          personality: buildPersonalityPrompt(config.personalitySettings),
          personality_settings: config.personalitySettings,
          voice_id: config.voiceId,
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

    if (previousConfig.voiceId !== config.voiceId) {
      await syncSpeechEngineVoice(config.voiceId);
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

    await syncSpeechEngineVoice(DEFAULT_ASSISTANT.voiceId);

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
