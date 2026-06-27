import { cache } from "react";
import { cookies } from "next/headers";

import {
  DEFAULT_ASSISTANT,
  type AssistantConfig,
} from "@/lib/orin/defaults";
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
    typeof config.name === "string" &&
    config.name.trim().length > 0 &&
    typeof config.personality === "string" &&
    config.personality.trim().length > 0 &&
    typeof config.voiceId === "string" &&
    config.voiceId.trim().length > 0 &&
    typeof config.firstMessage === "string" &&
    config.firstMessage.trim().length > 0
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
      name: parsed.name.trim(),
      personality: parsed.personality.trim(),
      voiceId: parsed.voiceId.trim(),
      firstMessage: parsed.firstMessage.trim(),
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
      name: config.name.trim(),
      personality: config.personality.trim(),
      voiceId: config.voiceId.trim(),
      firstMessage: config.firstMessage.trim(),
    }),
    COOKIE_OPTIONS,
  );
}

export async function clearAssistantConfigCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ORIN_ASSISTANT_CONFIG_COOKIE);
}

export function buildFirstMessage(name: string): string {
  const trimmed = name.trim() || DEFAULT_ASSISTANT.name;
  return `Hey — it's ${trimmed}. What's on your mind?`;
}

type AssistantConfigRow = {
  name: string;
  personality: string;
  voice_id: string;
  first_message: string;
};

function mapRow(row: AssistantConfigRow): AssistantConfig {
  return {
    name: row.name,
    personality: row.personality,
    voiceId: row.voice_id,
    firstMessage: row.first_message,
  };
}

export const getAssistantConfig = cache(async function getAssistantConfig(
  userId?: string | null,
): Promise<AssistantConfig> {
  if (userId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("assistant_configs")
      .select("name, personality, voice_id, first_message")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      return mapRow(data);
    }
  } else {
    const cookieConfig = await getAssistantConfigFromCookie();

    if (cookieConfig) {
      return cookieConfig;
    }
  }

  return DEFAULT_ASSISTANT;
});
