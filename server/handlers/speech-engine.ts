import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { Server as HttpServer } from "node:http";

import {
  clearVoiceHistorySnapshot,
  handleVoiceTranscript,
} from "@/lib/ai/generate-response";
import {
  bindLatestPendingVoiceSession,
  clearVoiceSession,
  resolveConversationByVoiceSession,
} from "@/lib/voice/conversation-binding";

const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;
const apiKey = process.env.ELEVENLABS_API_KEY;

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
  type BoundConversation = { id: string; user_id: string | null };
  const conversationByVoiceSession = new Map<string, BoundConversation>();

  async function getBoundConversation(
    voiceSessionId: string,
  ): Promise<BoundConversation | null> {
    const cached = conversationByVoiceSession.get(voiceSessionId);
    if (cached) {
      return cached;
    }

    let conversation = await resolveConversationByVoiceSession(voiceSessionId);

    if (!conversation) {
      const bound = await bindLatestPendingVoiceSession(voiceSessionId);
      if (bound?.conversationId) {
        conversation = await resolveConversationByVoiceSession(voiceSessionId);
      }
    }

    if (!conversation) {
      return null;
    }

    conversationByVoiceSession.set(voiceSessionId, conversation);
    return conversation;
  }

  return elevenlabs.speechEngine.attach(engineId, httpServer, path, {
    debug: true,
    async onInit(voiceSessionId) {
      console.log(`[orin:voice] session init ${voiceSessionId}`);

      try {
        const bound = await bindLatestPendingVoiceSession(voiceSessionId);

        if (bound) {
          console.log(
            `[orin:voice] bound session ${voiceSessionId} to conversation ${bound.conversationId}`,
          );
          return;
        }

        console.warn(
          `[orin:voice] no pending conversation to bind for session ${voiceSessionId}`,
        );
      } catch (error) {
        console.error("[orin:voice] failed to bind session on init", error);
      }
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
    await clearVoiceSession(conversation.id);
  }
}
