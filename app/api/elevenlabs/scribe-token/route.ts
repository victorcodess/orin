const SCRIBE_TOKEN_URL =
  "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe";

export async function POST() {
  const startedAt = performance.now();

  if (process.env.NODE_ENV === "development") {
    console.log("[orin:dictation] token API started");
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey.includes("your-")) {
    return Response.json(
      {
        error:
          "ELEVENLABS_API_KEY is not configured. Set it in .env.local and restart the dev server.",
      },
      { status: 500 }
    );
  }

  const response = await fetch(SCRIBE_TOKEN_URL, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => null)) as {
    token?: string;
    detail?: unknown;
  } | null;

  if (!response.ok || !data?.token) {
    return Response.json(
      { error: "Failed to create ElevenLabs Scribe token" },
      { status: response.ok ? 500 : response.status }
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[orin:dictation] token API complete (+${Math.round(performance.now() - startedAt)}ms)`
    );
  }

  return Response.json(
    { token: data.token },
    { headers: { "Cache-Control": "no-store" } }
  );
}
