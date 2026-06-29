import { resolve } from "node:path";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { config } from "dotenv";

import {
  buildSpeechEngineConversationConfig,
  buildSpeechEngineOverrides,
  buildSpeechEngineTtsConfig,
  buildSpeechEngineTurnConfig,
  buildSpeechEngineWsConfig,
} from "./lib/voice/speech-engine-config";

config({ path: resolve(process.cwd(), ".env.local") });

const apiKey = process.env.ELEVENLABS_API_KEY;
const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;
const wsUrl = process.env.VOICE_SERVER_PUBLIC_URL;

if (!apiKey || apiKey.includes("your-")) {
  throw new Error("Set ELEVENLABS_API_KEY in .env.local");
}

if (!engineId || engineId.includes("your-")) {
  throw new Error("Set ELEVENLABS_SPEECH_ENGINE_ID in .env.local");
}

if (!wsUrl || wsUrl.includes("your-") || wsUrl.includes("https://")) {
  throw new Error(
    "Set VOICE_SERVER_PUBLIC_URL in .env.local to wss://<ngrok-host>/ws (no https:// prefix)",
  );
}

const elevenlabs = new ElevenLabsClient({ apiKey });

const speechEngine = buildSpeechEngineWsConfig(wsUrl);

const engine = await elevenlabs.speechEngine.update(engineId, {
  speechEngine,
  tts: buildSpeechEngineTtsConfig(),
  turn: buildSpeechEngineTurnConfig(),
  conversation: buildSpeechEngineConversationConfig(),
  overrides: buildSpeechEngineOverrides(),
});

console.log("Updated Speech Engine:", engine.engineId);
console.log("wsUrl:", wsUrl);
console.log("requestHeaders:", speechEngine.requestHeaders ?? {});
