import { cache } from "react";
import { cookies } from "next/headers";

import {
  DEFAULT_ASSISTANT,
  type AssistantConfig,
} from "@/lib/orin/defaults";
import { normalizeVoiceId } from "@/lib/elevenlabs/voices";
import { parsePersonalitySettings } from "@/lib/orin/personality/parse";
import { parseVoiceSpeed } from "@/lib/orin/voice/speed";
import { createAdminClient } from "@/lib/supabase/admin";

export const ORIN_ASSISTANT_CONFIG_COOKIE = "orin_assistant_config";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

function isValidConfig(value: unknown): value is AssistantConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const config = value as Record<string, unknown>;

  return (
    typeof config.voiceId === "string" &&
    config.voiceId.trim().length > 0 &&
    config.personalitySettings !== undefined
  );
}

export async function getAssistantConfigFromCookie(): Promise<AssistantConfig | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ORIN_ASSISTANT_CONFIG_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isValidConfig(parsed)) {
      return null;
    }

    return {
      personalitySettings: parsePersonalitySettings(parsed.personalitySettings),
      voiceId: normalizeVoiceId(parsed.voiceId.trim()),
      voiceSpeed: parseVoiceSpeed(parsed.voiceSpeed),
    };
  } catch {
    return null;
  }
}

export async function setAssistantConfigCookie(
  config: AssistantConfig,
): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    ORIN_ASSISTANT_CONFIG_COOKIE,
    JSON.stringify({
      personalitySettings: config.personalitySettings,
      voiceId: config.voiceId.trim(),
      voiceSpeed: config.voiceSpeed,
    }),
    COOKIE_OPTIONS,
  );
}

export async function clearAssistantConfigCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ORIN_ASSISTANT_CONFIG_COOKIE);
}

export const getAssistantConfig = cache(async function getAssistantConfig(
  userId?: string | null,
): Promise<AssistantConfig> {
  if (userId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("assistant_configs")
      .select("personality_settings, voice_id, voice_speed")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      return {
        personalitySettings: parsePersonalitySettings(data.personality_settings),
        voiceId: normalizeVoiceId(data.voice_id),
        voiceSpeed: parseVoiceSpeed(data.voice_speed),
      };
    }
  } else {
    const cookieConfig = await getAssistantConfigFromCookie();
    if (cookieConfig) {
      return cookieConfig;
    }
  }

  return DEFAULT_ASSISTANT;
});
