import { resolve } from "node:path";

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { config } from "dotenv";

import {
  isVoiceSidecarReachable,
  publicSidecarHttpsUrl,
} from "../lib/voice/speech-engine-config";

config({ path: resolve(process.cwd(), ".env.local") });

const apiKey = process.env.ELEVENLABS_API_KEY;
const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;
const publicWsUrl = process.env.VOICE_SERVER_PUBLIC_URL;
const port = process.env.VOICE_SERVER_PORT ?? "3001";

function fail(message: string) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

function ok(message: string) {
  console.log(`✓ ${message}`);
}

async function main() {
  console.log("Orin voice setup check\n");

  if (!apiKey || apiKey.includes("your-")) {
    fail("ELEVENLABS_API_KEY is missing in .env.local");
  } else {
    ok("ELEVENLABS_API_KEY is set");
  }

  if (!engineId || engineId.includes("your-")) {
    fail("ELEVENLABS_SPEECH_ENGINE_ID is missing in .env.local");
  } else {
    ok(`ELEVENLABS_SPEECH_ENGINE_ID=${engineId}`);
  }

  if (!publicWsUrl || publicWsUrl.includes("your-")) {
    fail("VOICE_SERVER_PUBLIC_URL is missing in .env.local");
  } else if (!publicWsUrl.startsWith("wss://")) {
    fail(`VOICE_SERVER_PUBLIC_URL must start with wss:// (got ${publicWsUrl})`);
  } else if (!publicWsUrl.endsWith("/ws")) {
    fail(`VOICE_SERVER_PUBLIC_URL should end with /ws (got ${publicWsUrl})`);
  } else {
    ok(`VOICE_SERVER_PUBLIC_URL=${publicWsUrl}`);
  }

  try {
    const local = await fetch(`http://127.0.0.1:${port}/`);
    if (!local.ok) {
      fail(`Sidecar on port ${port} returned HTTP ${local.status}`);
    } else {
      ok(`Sidecar reachable on http://127.0.0.1:${port}/`);
    }
  } catch {
    fail(`Sidecar not running on port ${port}. Start \`npm run dev\` or \`npm run dev:voice\`.`);
  }

  const publicHttpsUrl = publicSidecarHttpsUrl(publicWsUrl);
  if (publicHttpsUrl) {
    if (!(await isVoiceSidecarReachable(publicWsUrl))) {
      fail(`Public sidecar not reachable at ${publicHttpsUrl}`);
    } else {
      ok(`Public sidecar reachable at ${publicHttpsUrl}`);
    }
  }

  if (apiKey && engineId && !engineId.includes("your-")) {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const engine = await elevenlabs.speechEngine.get(engineId);
    const configuredWsUrl = engine.config?.speechEngine?.wsUrl;

    if (configuredWsUrl !== publicWsUrl) {
      fail(
        `Speech Engine wsUrl mismatch.\n  ElevenLabs: ${configuredWsUrl}\n  .env.local: ${publicWsUrl}\n  Run: npm run update:engine`,
      );
    } else {
      ok("Speech Engine wsUrl matches .env.local");
    }

    const headers = engine.config?.speechEngine?.requestHeaders ?? {};
    if (publicWsUrl?.includes("ngrok") && !headers["ngrok-skip-browser-warning"]) {
      fail(
        "ngrok tunnel detected but Speech Engine has no ngrok-skip-browser-warning header. Run: npm run update:engine",
      );
    } else if (publicWsUrl?.includes("ngrok")) {
      ok("Speech Engine has ngrok bypass headers");
    }
  }

  console.log(
    "\nDuring a call, the sidecar should log:\n  [SpeechEngine] upgrade request: GET /ws\n  [SpeechEngine] upgrading connection to WebSocket\n  [orin:voice] session init ...\n",
  );
  console.log(
    "If those lines never appear, ElevenLabs cannot reach your sidecar. Check VOICE_SERVER_PUBLIC_URL and run `npm run update:engine`.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
