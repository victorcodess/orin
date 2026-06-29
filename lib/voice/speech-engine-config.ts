import type { ConversationConfigInput } from "@elevenlabs/elevenlabs-js/api/types/ConversationConfigInput";
import type { TtsConversationalConfigInput } from "@elevenlabs/elevenlabs-js/api/types/TtsConversationalConfigInput";
import { TtsConversationalModel } from "@elevenlabs/elevenlabs-js/api/types/TtsConversationalModel";

import { DEFAULT_ASSISTANT } from "@/lib/orin/defaults";
import { voiceSpeedToNumber } from "@/lib/orin/voice/speed";
import type { VoiceSpeed } from "@/lib/orin/voice/speed";

export function buildSpeechEngineWsConfig(wsUrl: string) {
  const config: {
    wsUrl: string;
    requestHeaders?: Record<string, string>;
  } = { wsUrl };

  if (
    wsUrl.includes("ngrok-free.dev") ||
    wsUrl.includes("ngrok.app") ||
    wsUrl.includes("ngrok.io")
  ) {
    config.requestHeaders = {
      "ngrok-skip-browser-warning": "true",
      "User-Agent": "Orin-SpeechEngine/1.0",
    };
  }

  return config;
}

/**
 * Client events the browser session should receive. `agent_chat_response_part`
 * is what streams Orin's reply into the chat token-by-token during a call, so
 * voice reads like a streamed text reply.
 */
export function buildSpeechEngineConversationConfig(): ConversationConfigInput {
  return {
    clientEvents: [
      "audio",
      "interruption",
      "user_transcript",
      "agent_response",
      "agent_response_correction",
      "agent_chat_response_part",
    ],
  };
}

/** Speech Engine TTS is configured on the resource — client-side voice overrides are not allowed. */
export function buildSpeechEngineTtsConfig(
  voiceId: string = DEFAULT_ASSISTANT.voiceId,
  voiceSpeed: VoiceSpeed = DEFAULT_ASSISTANT.voiceSpeed,
): TtsConversationalConfigInput {
  return {
    modelId: TtsConversationalModel.ElevenFlashV2,
    voiceId,
    speed: voiceSpeedToNumber(voiceSpeed),
  };
}

/** User speaks first — do not allow client-provided first messages. */
export function buildSpeechEngineOverrides() {
  return {
    firstMessage: false,
  };
}

/** User speaks first — empty first message is the Speech Engine default. */
export function buildSpeechEngineTurnConfig() {
  return {
    initialWaitTime: 60,
    silenceEndCallTimeout: 30,
  };
}
