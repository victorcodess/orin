import "server-only";

import { cache } from "react";
import fs from "fs";
import path from "path";

import { resolvedDisplayName } from "@/lib/auth/google-display-name";
import { createAdminClient } from "@/lib/supabase/admin";

const DOCS_DIR = path.join(process.cwd(), "lib/orin/personality/docs");
const DEFAULT_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const RUNTIME_CONTEXT_TEMPLATE = fs
  .readFileSync(path.join(DOCS_DIR, "runtime-context.md"), "utf-8")
  .split("\n## Implementation Notes")[0]
  .trim();

export type RuntimeContextInput = {
  mode?: "text" | "voice";
  userName?: string | null;
  customInstructions?: string;
  now?: Date;
  timeZone?: string;
};

type VoiceSessionRuntime = {
  userName?: string | null;
  timeZone?: string;
};

const MODALITY_COPY: Record<"text" | "voice", string> = {
  text: "Text chat — they're typing messages.",
  voice: "Voice call — they're talking to you live.",
};

const voiceSessionRuntimeByConversation = new Map<
  string,
  VoiceSessionRuntime
>();

export function setVoiceSessionRuntime(
  conversationId: string,
  runtime: VoiceSessionRuntime
) {
  voiceSessionRuntimeByConversation.set(conversationId, {
    userName: runtime.userName ?? null,
    timeZone: runtime.timeZone?.trim() || undefined,
  });
}

export function getVoiceSessionRuntime(
  conversationId: string
): VoiceSessionRuntime {
  return voiceSessionRuntimeByConversation.get(conversationId) ?? {};
}

export function clearVoiceSessionRuntime(conversationId: string) {
  voiceSessionRuntimeByConversation.delete(conversationId);
}

/** Cached per request — one profile read even if called multiple times. */
export const getPromptUserName = cache(async function getPromptUserName(
  userId: string,
  authUser: Parameters<typeof resolvedDisplayName>[1]
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  return resolvedDisplayName(data?.display_name, authUser);
});

function promptFirstName(name: string): string {
  const trimmed = name.trim();
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function formatDateTime(now: Date, timeZone: string) {
  const dayOfWeek = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  }).format(now);

  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone,
  }).format(now);

  const time = new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
    timeZone,
  }).format(now);

  const timeZoneLabel =
    new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
      timeZone,
    })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone;

  return { dayOfWeek, date, time, timeZone: timeZoneLabel };
}

export function buildRuntimeContext(input: RuntimeContextInput = {}): string {
  const now = input.now ?? new Date();
  const timeZone = input.timeZone ?? DEFAULT_TIME_ZONE;
  const {
    dayOfWeek,
    date,
    time,
    timeZone: timeZoneLabel,
  } = formatDateTime(now, timeZone);

  const userName = input.userName?.trim();
  const userNameLabel = userName ? promptFirstName(userName) : "not shared";

  const customInstructions = input.customInstructions?.trim();
  const customSection = customInstructions
    ? customInstructions
    : "The user hasn't set any personal instructions.";

  const mode = input.mode ?? "text";

  return RUNTIME_CONTEXT_TEMPLATE.replace(/\{\{DAY_OF_WEEK\}\}/g, dayOfWeek)
    .replace(/\{\{DATE\}\}/g, date)
    .replace(/\{\{TIME\}\}/g, time)
    .replace(/\{\{TIMEZONE\}\}/g, timeZoneLabel)
    .replace(/\{\{USER_NAME\}\}/g, userNameLabel)
    .replace(/\{\{MODALITY\}\}/g, MODALITY_COPY[mode])
    .replace(/\{\{CUSTOM_INSTRUCTIONS\}\}/g, customSection);
}
