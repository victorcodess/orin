import "server-only";

import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { getAssistantConfig } from "@/lib/ai/assistant-config";
import { toUIMessages } from "@/lib/ai/message-utils";
import { loadHistory, saveMessage } from "@/lib/ai/messages";
import { sanitizeUIMessagesForModel } from "@/lib/ai/message-utils";
import { buildPersonalityPrompt } from "@/lib/orin/personality/prompts";
import type { AssistantConfig } from "@/lib/orin/defaults";

type TranscriptEntry = { role: "user" | "agent"; content: string };

/**
 * Cap how many recent messages are sent to the model each voice turn. The full
 * thread still persists in the DB and renders in the chat — this only bounds the
 * prompt so time-to-first-token (and cost) doesn't grow with conversation length.
 */
const VOICE_PROMPT_MESSAGE_LIMIT = 40;

/**
 * Snapshot of the conversation history that existed *before* the current voice
 * call started. Captured once per call so the LLM prompt is always
 * `[prior thread history] + [live call transcript]` with no duplication. The
 * live call turns come straight from the ElevenLabs transcript (the canonical,
 * turn-separated record), exactly as the Speech Engine cookbook intends.
 */
const priorHistoryByConversation = new Map<string, Promise<UIMessage[]>>();

// Assistant config is stable for the lifetime of a call, so resolve it once and
// reuse it on every turn instead of hitting the DB before each reply.
const configByConversation = new Map<string, Promise<AssistantConfig>>();

// ElevenLabs re-sends the full transcript many times per turn, revising the
// latest turn as speech-to-text refines it. Persisting must therefore be
// serialized so concurrent transcript events can't interleave rows. This map
// chains all DB writes for a call so they run one-at-a-time in turn order.
const writeQueueByConversation = new Map<string, Promise<unknown>>();

// The last user / assistant turn actually persisted for a call. Used to drop the
// consecutive near-duplicate turns ElevenLabs emits while refining a transcript
// or while a reply is being interrupted and retried.
const lastUserByConversation = new Map<string, string>();
const lastAssistantByConversation = new Map<string, string>();

function ensurePriorHistory(conversationId: string): Promise<UIMessage[]> {
  const existing = priorHistoryByConversation.get(conversationId);
  if (existing) {
    return existing;
  }

  const promise = loadHistory(conversationId)
    .then(toUIMessages)
    .catch((error) => {
      // Don't cache failures — allow the next turn to retry.
      priorHistoryByConversation.delete(conversationId);
      throw error;
    });

  priorHistoryByConversation.set(conversationId, promise);
  return promise;
}

function ensureAssistantConfig(
  conversationId: string,
  userId?: string | null,
): Promise<AssistantConfig> {
  const existing = configByConversation.get(conversationId);
  if (existing) {
    return existing;
  }

  const promise = getAssistantConfig(userId).catch((error) => {
    configByConversation.delete(conversationId);
    throw error;
  });

  configByConversation.set(conversationId, promise);
  return promise;
}

export async function clearVoiceHistorySnapshot(conversationId: string) {
  // Let any in-flight writes finish before tearing down the dedup state they
  // read, otherwise a trailing write could re-persist a turn.
  const pending = writeQueueByConversation.get(conversationId);
  if (pending) {
    try {
      await pending;
    } catch {
      // Write errors are already logged at the source; nothing to do here.
    }
  }

  priorHistoryByConversation.delete(conversationId);
  configByConversation.delete(conversationId);
  writeQueueByConversation.delete(conversationId);
  lastUserByConversation.delete(conversationId);
  lastAssistantByConversation.delete(conversationId);
}

/** Run a DB write after all earlier writes for this call have settled. */
function enqueueWrite(
  conversationId: string,
  task: () => Promise<void>,
): Promise<void> {
  const prev = writeQueueByConversation.get(conversationId) ?? Promise.resolve();
  const next = prev.then(() => task());
  // Keep the chain alive even if one write rejects.
  writeQueueByConversation.set(
    conversationId,
    next.catch(() => {}),
  );
  return next;
}

/**
 * Build the LLM prompt turns from the transcript, collapsing consecutive
 * same-role duplicates so the speech-to-text refinements ElevenLabs streams
 * don't pollute the model's context.
 */
/**
 * ElevenLabs emits a turn for silence / non-speech (e.g. "..." when the mic is
 * muted or the user goes quiet). Those carry no letters or digits — treat them
 * as "no input" so they never trigger a reply or get persisted.
 */
function hasSpeech(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

function transcriptToUiMessages(transcript: TranscriptEntry[]): UIMessage[] {
  const messages: UIMessage[] = [];
  let previous: { role: "user" | "assistant"; text: string } | null = null;

  for (const entry of transcript) {
    const text = entry.content.trim();
    const role = entry.role === "agent" ? "assistant" : "user";

    // Drop silent/non-speech user turns so they don't pollute the prompt.
    if (role === "user" && !hasSpeech(text)) {
      continue;
    }

    if (!text) {
      continue;
    }

    if (previous && previous.role === role && previous.text === text) {
      continue;
    }

    previous = { role, text };
    messages.push({
      id: crypto.randomUUID(),
      role,
      parts: [{ type: "text", text }],
    });
  }

  return messages;
}

/**
 * The text of the latest user turn, or "" when that turn is silence/non-speech.
 * Only the most recent user turn matters — we never reach back past a silent
 * turn to re-answer an older one.
 */
function latestUserText(transcript: TranscriptEntry[]): string {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const entry = transcript[index];
    if (entry.role === "user") {
      const text = entry.content.trim();
      return hasSpeech(text) ? text : "";
    }
  }

  return "";
}

export async function handleVoiceTranscript({
  conversationId,
  userId,
  transcript,
  signal,
}: {
  conversationId: string;
  userId?: string | null;
  transcript: TranscriptEntry[];
  signal: AbortSignal;
}) {
  // The turn we're replying to is the latest user entry in the transcript.
  const userText = latestUserText(transcript);
  if (!userText) {
    return null;
  }

  // Capture pre-call history *before* persisting this turn so the snapshot never
  // includes live-call turns (which arrive via the transcript instead).
  const [config, priorHistory] = await Promise.all([
    ensureAssistantConfig(conversationId, userId),
    ensurePriorHistory(conversationId),
  ]);

  const promptMessages: UIMessage[] = [
    ...priorHistory,
    ...transcriptToUiMessages(transcript),
  ].slice(-VOICE_PROMPT_MESSAGE_LIMIT);

  const modelMessages = await convertToModelMessages(
    sanitizeUIMessagesForModel(promptMessages),
  );

  if (modelMessages.length === 0) {
    return null;
  }

  let fullText = "";

  async function* textStream() {
    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: buildPersonalityPrompt(config.personalitySettings),
      messages: modelMessages,
      abortSignal: signal,
    });

    try {
      for await (const chunk of result.textStream) {
        if (signal.aborted) {
          return;
        }

        fullText += chunk;
        yield chunk;
      }
    } catch (error) {
      // An interruption aborts the stream mid-flight; treat that as a clean
      // stop rather than letting it bubble up to the sidecar.
      if (signal.aborted) {
        return;
      }

      throw error;
    }
  }

  return {
    stream: textStream(),
    // Persist the user turn and its reply together, and only once the reply has
    // actually been delivered. Turns that were interrupted before producing a
    // reply (the speech-to-text revision noise) never reach here, so the saved
    // thread stays a clean 1:1 alternation.
    persist: async () => {
      if (signal.aborted) {
        return;
      }

      const assistantText = fullText.trim();
      if (!assistantText) {
        return;
      }

      await enqueueWrite(conversationId, async () => {
        // Persist the user turn and its reply as one atomic pair. Skip only an
        // exact repeat of the previous pair (the interruption/re-send loop).
        // Saving them together — never one without the other — keeps the thread
        // a clean user→assistant alternation.
        if (
          lastUserByConversation.get(conversationId) === userText &&
          lastAssistantByConversation.get(conversationId) === assistantText
        ) {
          return;
        }

        await saveMessage({
          conversationId,
          role: "user",
          content: userText,
          source: "voice",
        });
        await saveMessage({
          conversationId,
          role: "assistant",
          content: assistantText,
          source: "voice",
        });

        lastUserByConversation.set(conversationId, userText);
        lastAssistantByConversation.set(conversationId, assistantText);
      });
    },
  };
}
