import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { Server as HttpServer } from "node:http";

import {
  clearVoiceHistorySnapshot,
  handleVoiceTranscript,
} from "@/lib/ai/generate-response";
import {
  resolveConversationByVoiceSession,
} from "@/lib/voice/conversation-binding";

const BIND_RETRY_ATTEMPTS = 30;
const BIND_RETRY_DELAY_MS = 200;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;
const apiKey = process.env.ELEVENLABS_API_KEY;

const VOICE_FALLBACK_REPLY =
  "Sorry, I ran into a problem answering that. Please try again.";

export async function attachSpeechEngine(httpServer: HttpServer, path = "/ws") {
  if (!apiKey || apiKey.includes("your-")) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  if (!engineId || engineId.includes("your-")) {
    throw new Error("ELEVENLABS_SPEECH_ENGINE_ID is not configured");
  }

  const elevenlabs = new ElevenLabsClient({ apiKey });

  // Once a voice session is bound to a conversation it never changes, so cache
  // the lookup and skip a Supabase round-trip on every transcript turn.
  type BoundConversation = { id: string; user_id: string | null; session_id: string | null };
  const conversationByVoiceSession = new Map<string, BoundConversation>();

  async function getBoundConversation(
    voiceSessionId: string,
  ): Promise<BoundConversation | null> {
    const cached = conversationByVoiceSession.get(voiceSessionId);
    if (cached) {
      return cached;
    }

    // The browser binds this session to its conversation via /api/voice/bind on
    // connect (keyed by a per-call pending token). That request can land a beat
    // after the sidecar starts handling the session, so retry briefly. We never
    // guess "the latest pending conversation" — that races across concurrent
    // callers and could attach a session to the wrong user's chat.
    for (let attempt = 0; attempt < BIND_RETRY_ATTEMPTS; attempt += 1) {
      const conversation = await resolveConversationByVoiceSession(voiceSessionId);
      if (conversation) {
        conversationByVoiceSession.set(voiceSessionId, conversation);
        return conversation;
      }

      await delay(BIND_RETRY_DELAY_MS);
    }

    return null;
  }

  return elevenlabs.speechEngine.attach(engineId, httpServer, path, {
    debug: true,
    onInit(voiceSessionId) {
      // The browser binds this session to its conversation via /api/voice/bind;
      // nothing to do here but log.
      console.log(`[orin:voice] session init ${voiceSessionId}`);
    },
    async onTranscript(transcript, signal, session) {
      const voiceSessionId = session.conversationId;

      if (!voiceSessionId) {
        return;
      }

      const conversation = await getBoundConversation(voiceSessionId);

      if (!conversation) {
        console.warn(
          `[orin:voice] no conversation bound for session ${voiceSessionId}`,
        );
        return;
      }

      try {
        const response = await handleVoiceTranscript({
          conversationId: conversation.id,
          userId: conversation.user_id,
          sessionId: conversation.session_id,
          transcript,
          signal,
        });

        if (!response) {
          return;
        }

        await session.sendResponse(response.stream);
        await response.persist();
      } catch (error) {
        // Interruptions abort the in-flight reply via the signal — that's
        // expected turn-taking, not a failure, so don't log or rethrow it
        // (rethrowing surfaced as an unhandled rejection).
        if (signal.aborted) {
          return;
        }

        console.error("[orin:voice] transcript handler failed", error);
        await session.sendResponse(VOICE_FALLBACK_REPLY).catch((fallbackError) => {
          console.error("[orin:voice] fallback response failed", fallbackError);
        });
      }
    },
    async onClose(session) {
      await cleanupSession(session.conversationId);
    },
    async onDisconnect(session) {
      await cleanupSession(session.conversationId);
    },
    onError(error, session) {
      console.error("[orin:voice] speech engine error", error, session.conversationId);
    },
  });

  async function cleanupSession(voiceSessionId: string | undefined) {
    if (!voiceSessionId) {
      return;
    }

    const conversation =
      conversationByVoiceSession.get(voiceSessionId) ??
      (await resolveConversationByVoiceSession(voiceSessionId));

    conversationByVoiceSession.delete(voiceSessionId);

    if (!conversation) {
      return;
    }

    await clearVoiceHistorySnapshot(conversation.id);
  }
}
