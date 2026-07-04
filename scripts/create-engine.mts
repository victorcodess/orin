import { resolve } from "node:path";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { config } from "dotenv";

import {
  buildSpeechEngineConversationConfig,
  buildSpeechEngineOverrides,
  buildSpeechEngineTtsConfig,
  buildSpeechEngineTurnConfig,
  buildSpeechEngineWsConfig,
} from "../lib/voice/speech-engine-config";

config({ path: resolve(process.cwd(), ".env.local") });

const apiKey = process.env.ELEVENLABS_API_KEY;
const wsUrl = process.env.VOICE_SERVER_PUBLIC_URL;

if (!apiKey || apiKey.includes("your-")) {
  throw new Error("Set ELEVENLABS_API_KEY in .env.local");
}

if (!wsUrl || wsUrl.includes("your-") || wsUrl.includes("https://")) {
  throw new Error(
    "Set VOICE_SERVER_PUBLIC_URL in .env.local to wss://<ngrok-host>/ws (no https:// prefix)",
  );
}

const elevenlabs = new ElevenLabsClient({ apiKey });

const engine = await elevenlabs.speechEngine.create({
  name: "Orin Speech Engine",
  speechEngine: buildSpeechEngineWsConfig(wsUrl),
  tts: buildSpeechEngineTtsConfig(),
  turn: buildSpeechEngineTurnConfig(),
  conversation: buildSpeechEngineConversationConfig(),
  overrides: buildSpeechEngineOverrides(),
});

console.log("Speech Engine ID:", engine.engineId);
console.log("Add to .env.local:");
console.log(`ELEVENLABS_SPEECH_ENGINE_ID=${engine.engineId}`);
