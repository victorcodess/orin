import type { ConversationConfigInput } from "@elevenlabs/elevenlabs-js/api/types/ConversationConfigInput";
import type { TtsConversationalConfigInput } from "@elevenlabs/elevenlabs-js/api/types/TtsConversationalConfigInput";
import type { TtsConversationalModel } from "@elevenlabs/elevenlabs-js/api/types/TtsConversationalModel";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

import { VOICE_CALL_TTS_MODEL } from "@/lib/ai/model";

import { DEFAULT_ASSISTANT, type AssistantConfig } from "@/lib/orin/defaults";
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

export function publicSidecarHttpsUrl(
  publicWsUrl = process.env.VOICE_SERVER_PUBLIC_URL,
): string | null {
  if (!publicWsUrl?.startsWith("wss://") || publicWsUrl.includes("your-")) {
    return null;
  }

  return publicWsUrl.replace(/^wss:\/\//, "https://").replace(/\/ws$/, "/");
}

/** Preflight check before minting a voice token. */
export async function isVoiceSidecarReachable(
  publicWsUrl = process.env.VOICE_SERVER_PUBLIC_URL,
): Promise<boolean> {
  const httpsUrl = publicSidecarHttpsUrl(publicWsUrl);
  if (!httpsUrl) {
    return true;
  }

  try {
    const response = await fetch(httpsUrl, {
      signal: AbortSignal.timeout(4_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function voiceSidecarUnreachableMessage(
  publicWsUrl = process.env.VOICE_SERVER_PUBLIC_URL,
): string {
  const host =
    publicWsUrl?.replace(/^wss:\/\//, "").replace(/\/ws$/, "") ?? "sidecar";
  const localHint =
    host.includes("ngrok") || host.includes("localhost")
      ? " For local dev, run `npm run dev:tunnel`."
      : "";

  return `Voice sidecar is not reachable at ${host}. Check VOICE_SERVER_PUBLIC_URL and run \`npm run update:engine\` if you changed it.${localHint}`;
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
    modelId: VOICE_CALL_TTS_MODEL as TtsConversationalModel,
    voiceId,
    speed: voiceSpeedToNumber(voiceSpeed),
    expressiveMode: true,
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

function speedsMatch(current?: number, next?: number) {
  if (current == null && next == null) {
    return true;
  }

  if (current == null || next == null) {
    return false;
  }

  return Math.abs(current - next) < 0.001;
}

/** Push voice + speed to the shared Speech Engine (before saves and calls). */
export async function syncSpeechEngineTts(
  config: AssistantConfig,
  apiKeyOverride?: string,
) {
  const apiKey = apiKeyOverride ?? process.env.ELEVENLABS_API_KEY;
  const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;

  if (!apiKey || apiKey.includes("your-") || !engineId || engineId.includes("your-")) {
    return;
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const engine = await elevenlabs.speechEngine.get(engineId);
    const currentTts = engine.config?.tts;
    const nextTts = buildSpeechEngineTtsConfig(config.voiceId, config.voiceSpeed);

    if (
      currentTts?.voiceId === nextTts.voiceId &&
      speedsMatch(currentTts?.speed, nextTts.speed) &&
      currentTts?.modelId === nextTts.modelId &&
      currentTts?.expressiveMode === nextTts.expressiveMode
    ) {
      return;
    }

    await elevenlabs.speechEngine.update(engineId, { tts: nextTts });
  } catch {
  }
}
