import { createServer } from "node:http";
import { resolve } from "node:path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });

const port = Number(process.env.VOICE_SERVER_PORT ?? 3001);
const path = process.env.VOICE_SERVER_PATH ?? "/ws";
const publicWsUrl = process.env.VOICE_SERVER_PUBLIC_URL;
const engineId = process.env.ELEVENLABS_SPEECH_ENGINE_ID;
const engineConfigured =
  Boolean(engineId) && !engineId!.includes("your-");

async function main() {
  const { attachSpeechEngine } = await import("./handlers/speech-engine");

  // Match ElevenLabs cookbook: bare HTTP server, attach Speech Engine, then listen.
  const httpServer = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Orin Speech Engine sidecar");
  });

  if (engineConfigured) {
    await attachSpeechEngine(httpServer, path);
    console.log(`[orin:voice] speech engine attached at ${path}`);
  } else {
    console.warn(
      "[orin:voice] ELEVENLABS_SPEECH_ENGINE_ID not set — sidecar will not accept voice sessions",
    );
  }

  httpServer.listen(port, () => {
    console.log(`[orin:voice] listening on http://localhost:${port}${path}`);
    if (publicWsUrl) {
      console.log(`[orin:voice] public wsUrl (must match Speech Engine): ${publicWsUrl}`);
    } else {
      console.warn(
        "[orin:voice] VOICE_SERVER_PUBLIC_URL is not set — update-engine/create-engine cannot configure ElevenLabs",
      );
    }
    console.log(
      "[orin:voice] tunnel required: run `ngrok http 3001` or `npm run dev:tunnel`, then `npx tsx update-engine.mts`",
    );
  });
}

main().catch((error) => {
  console.error("[orin:voice] failed to start sidecar", error);
  process.exit(1);
});
