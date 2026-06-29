import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import {
  clearAssistantConfigCookie,
  getAssistantConfig,
  setAssistantConfigCookie,
} from "@/lib/ai/assistant-config";
import { DEFAULT_ASSISTANT, type AssistantConfig } from "@/lib/orin/defaults";
import { normalizeVoiceId } from "@/lib/elevenlabs/voices";
import { buildPersonalityPrompt } from "@/lib/orin/personality/prompts";
import { personalitySettingsEqual, parsePersonalitySettings } from "@/lib/orin/personality/parse";
import { parseVoiceSpeed, type VoiceSpeed } from "@/lib/orin/voice/speed";
import { debugError } from "@/lib/debug";
import { getErrorMessage } from "@/lib/errors";
import { buildSpeechEngineTtsConfig } from "@/lib/voice/speech-engine-config";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { PersonalitySettings } from "@/lib/orin/personality/types";

type AssistantConfigPayload = {
  personalitySettings?: PersonalitySettings;
  voiceId?: string;
  voiceSpeed?: VoiceSpeed;
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
  const voiceSpeed = parseVoiceSpeed(payload.voiceSpeed);

  return {
    personalitySettings,
    voiceId: normalizeVoiceId(voiceId),
    voiceSpeed,
  };
}

function isDefaultConfig(config: AssistantConfig) {
  return (
    config.voiceId === DEFAULT_ASSISTANT.voiceId &&
    config.voiceSpeed === DEFAULT_ASSISTANT.voiceSpeed &&
    personalitySettingsEqual(
      config.personalitySettings,
      DEFAULT_ASSISTANT.personalitySettings,
    )
  );
}

async function syncSpeechEngineTts(config: AssistantConfig) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;

  if (!apiKey || apiKey.includes("your-") || !engineId || engineId.includes("your-")) {
    return;
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const engine = await elevenlabs.speechEngine.get(engineId);
    const currentTts = engine.config?.tts;
    const nextTts = buildSpeechEngineTtsConfig(config.voiceId, config.voiceSpeed);

    if (
      currentTts?.voiceId === nextTts.voiceId &&
      currentTts?.speed === nextTts.speed
    ) {
      return;
    }

    await elevenlabs.speechEngine.update(engineId, {
      tts: nextTts,
    });
  } catch (error) {
    debugError("api/assistant-config", "failed to sync speech engine tts", error);
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
          voice_speed: config.voiceSpeed,
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

    if (
      previousConfig.voiceId !== config.voiceId ||
      previousConfig.voiceSpeed !== config.voiceSpeed
    ) {
      await syncSpeechEngineTts(config);
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

    await syncSpeechEngineTts(DEFAULT_ASSISTANT);

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
