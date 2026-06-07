import {
  DEFAULT_ASSISTANT,
  type AssistantConfig,
} from "@/lib/orin/defaults";
import { createAdminClient } from "@/lib/supabase/admin";

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

export async function getAssistantConfig(
  userId?: string | null,
): Promise<AssistantConfig> {
  const supabase = createAdminClient();

  if (userId) {
    const { data } = await supabase
      .from("assistant_configs")
      .select("name, personality, voice_id, first_message")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      return mapRow(data);
    }
  }

  const { data: defaultConfig } = await supabase
    .from("assistant_configs")
    .select("name, personality, voice_id, first_message")
    .eq("is_default", true)
    .maybeSingle();

  if (defaultConfig) {
    return mapRow(defaultConfig);
  }

  return DEFAULT_ASSISTANT;
}
