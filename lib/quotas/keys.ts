import "server-only";

import { decryptSecret, encryptSecret, maskSecret } from "@/lib/crypto/secrets";
import { createAdminClient } from "@/lib/supabase/admin";

export type StoredUserKeys = {
  openaiKey: string | null;
  elevenlabsKey: string | null;
};

export type MaskedUserKeys = {
  openaiMasked: string | null;
  elevenlabsMasked: string | null;
  hasOpenaiKey: boolean;
  hasElevenlabsKey: boolean;
};

function platformOpenAIKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes("your-")) {
    return null;
  }
  return key;
}

function platformElevenLabsKey(): string | null {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key || key.includes("your-")) {
    return null;
  }
  return key;
}

export function getPlatformOpenAIKey(): string {
  const key = platformOpenAIKey();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Set a real key in .env.local and restart the dev server.",
    );
  }
  return key;
}

export function getPlatformElevenLabsKey(): string {
  const key = platformElevenLabsKey();
  if (!key) {
    throw new Error(
      "ELEVENLABS_API_KEY is not configured. Set it in .env.local and restart the dev server.",
    );
  }
  return key;
}

export async function getStoredUserKeys(userId: string): Promise<StoredUserKeys> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("openai_api_key_encrypted, elevenlabs_api_key_encrypted")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    openaiKey: data?.openai_api_key_encrypted
      ? decryptSecret(data.openai_api_key_encrypted)
      : null,
    elevenlabsKey: data?.elevenlabs_api_key_encrypted
      ? decryptSecret(data.elevenlabs_api_key_encrypted)
      : null,
  };
}

export async function getMaskedUserKeys(userId: string): Promise<MaskedUserKeys> {
  const keys = await getStoredUserKeys(userId);

  return {
    openaiMasked: keys.openaiKey ? maskSecret(keys.openaiKey) : null,
    elevenlabsMasked: keys.elevenlabsKey ? maskSecret(keys.elevenlabsKey) : null,
    hasOpenaiKey: Boolean(keys.openaiKey),
    hasElevenlabsKey: Boolean(keys.elevenlabsKey),
  };
}

export async function saveUserKeys(
  userId: string,
  payload: { openaiKey?: string | null; elevenlabsKey?: string | null },
): Promise<void> {
  const supabase = createAdminClient();
  const updates: {
    openai_api_key_encrypted?: string | null;
    elevenlabs_api_key_encrypted?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (payload.openaiKey !== undefined) {
    const trimmed = payload.openaiKey?.trim() ?? "";
    updates.openai_api_key_encrypted = trimmed
      ? encryptSecret(trimmed)
      : null;
  }

  if (payload.elevenlabsKey !== undefined) {
    const trimmed = payload.elevenlabsKey?.trim() ?? "";
    updates.elevenlabs_api_key_encrypted = trimmed
      ? encryptSecret(trimmed)
      : null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export function userHasKeysForOperation(
  keys: StoredUserKeys,
  needs: { openai?: boolean; elevenlabs?: boolean },
): boolean {
  if (needs.openai && !keys.openaiKey) {
    return false;
  }

  if (needs.elevenlabs && !keys.elevenlabsKey) {
    return false;
  }

  return true;
}
