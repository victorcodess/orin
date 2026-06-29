import { createHash } from "crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ensureSessionCookie, getSessionId } from "@/lib/session";

import { READ_ALOUD_BUCKET, READ_ALOUD_TTS_MODEL } from "./tts-config";
import type { VoiceSpeed } from "@/lib/orin/voice/speed";

export function readAloudContentHash(
  text: string,
  voiceId: string,
  voiceSpeed: VoiceSpeed,
  modelId = READ_ALOUD_TTS_MODEL,
) {
  return createHash("sha256")
    .update(`${modelId}\0${voiceId}\0${voiceSpeed}\0${text}`)
    .digest("hex");
}

export function readAloudStoragePath(ownerId: string, contentHash: string) {
  return `${ownerId}/${contentHash}.mp3`;
}

export async function getReadAloudOwnerId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user?.id) {
    return data.user.id;
  }

  const sessionId = (await getSessionId()) ?? (await ensureSessionCookie());
  return `session_${sessionId}`;
}

export async function downloadCachedReadAloudAudio({
  ownerId,
  text,
  voiceId,
  voiceSpeed,
}: {
  ownerId: string;
  text: string;
  voiceId: string;
  voiceSpeed: VoiceSpeed;
}): Promise<Blob | null> {
  const supabase = createAdminClient();
  const path = readAloudStoragePath(
    ownerId,
    readAloudContentHash(text, voiceId, voiceSpeed),
  );

  const { data, error } = await supabase.storage
    .from(READ_ALOUD_BUCKET)
    .download(path);

  if (error || !data) {
    return null;
  }

  return data;
}

export async function uploadCachedReadAloudAudio({
  ownerId,
  text,
  voiceId,
  voiceSpeed,
  audio,
}: {
  ownerId: string;
  text: string;
  voiceId: string;
  voiceSpeed: VoiceSpeed;
  audio: ArrayBuffer;
}): Promise<void> {
  const supabase = createAdminClient();
  const path = readAloudStoragePath(
    ownerId,
    readAloudContentHash(text, voiceId, voiceSpeed),
  );

  const { error } = await supabase.storage.from(READ_ALOUD_BUCKET).upload(
    path,
    audio,
    {
      contentType: "audio/mpeg",
      upsert: true,
    }
  );

  if (error) {
    throw error;
  }
}
