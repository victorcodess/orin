import "server-only";

import type { QuotaContext, QuotaOperation } from "@/lib/quotas/types";
import { QuotaBlockedError } from "@/lib/quotas/errors";
import { isUnderQuota } from "@/lib/quotas/limits";
import {
  getPlatformElevenLabsKey,
  getPlatformOpenAIKey,
  getStoredUserKeys,
  userHasKeysForOperation,
} from "@/lib/quotas/keys";

const OPERATION_KEY_NEEDS: Record<
  QuotaOperation,
  { openai: boolean; elevenlabs: boolean }
> = {
  new_conversation: { openai: true, elevenlabs: false },
  message_turn: { openai: true, elevenlabs: false },
  voice_session: { openai: true, elevenlabs: true },
  read_aloud: { openai: false, elevenlabs: true },
};

const ANON_BLOCKED: QuotaOperation[] = ["voice_session", "read_aloud"];

export async function assertQuotaAllowed(
  ctx: QuotaContext,
  operation: QuotaOperation,
): Promise<void> {
  if (!ctx.userId && ANON_BLOCKED.includes(operation)) {
    throw new QuotaBlockedError(
      "Sign in to use voice calls and read aloud.",
      "feature_requires_auth",
      "signup",
    );
  }

  if (await isUnderQuota(ctx, operation)) {
    return;
  }

  if (!ctx.userId) {
    throw new QuotaBlockedError(
      "Free allowance used. Create an account to continue.",
      "signup_required",
      "signup",
    );
  }

  const keys = await getStoredUserKeys(ctx.userId);
  const needs = OPERATION_KEY_NEEDS[operation];

  if (userHasKeysForOperation(keys, needs)) {
    return;
  }

  const missing: string[] = [];
  if (needs.openai && !keys.openaiKey) {
    missing.push("OpenAI");
  }
  if (needs.elevenlabs && !keys.elevenlabsKey) {
    missing.push("ElevenLabs");
  }

  throw new QuotaBlockedError(
    `Free allowance used. Add your ${missing.join(" and ")} API key${missing.length > 1 ? "s" : ""} in Settings to continue.`,
    "keys_required",
    "add_keys",
  );
}

export async function resolveOpenAIKey(
  ctx: QuotaContext,
  operation: QuotaOperation,
): Promise<{ key: string; source: "platform" | "user" }> {
  await assertQuotaAllowed(ctx, operation);

  if (await isUnderQuota(ctx, operation)) {
    return { key: getPlatformOpenAIKey(), source: "platform" };
  }

  if (!ctx.userId) {
    throw new QuotaBlockedError(
      "Free allowance used. Create an account to continue.",
      "signup_required",
      "signup",
    );
  }

  const keys = await getStoredUserKeys(ctx.userId);
  if (!keys.openaiKey) {
    throw new QuotaBlockedError(
      "Add your OpenAI API key in Settings to continue.",
      "keys_required",
      "add_keys",
    );
  }

  return { key: keys.openaiKey, source: "user" };
}

export async function resolveElevenLabsKey(
  ctx: QuotaContext,
  operation: QuotaOperation,
): Promise<{ key: string; source: "platform" | "user" }> {
  await assertQuotaAllowed(ctx, operation);

  if (await isUnderQuota(ctx, operation)) {
    return { key: getPlatformElevenLabsKey(), source: "platform" };
  }

  if (!ctx.userId) {
    throw new QuotaBlockedError(
      "Sign in to use this feature.",
      "feature_requires_auth",
      "signup",
    );
  }

  const keys = await getStoredUserKeys(ctx.userId);
  if (!keys.elevenlabsKey) {
    throw new QuotaBlockedError(
      "Add your ElevenLabs API key in Settings to continue.",
      "keys_required",
      "add_keys",
    );
  }

  return { key: keys.elevenlabsKey, source: "user" };
}
