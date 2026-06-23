const TTS_MODEL = "eleven_flash_v2_5";

type TextToSpeechRequestBody = {
  text?: string;
  voiceId?: string;
};

export async function POST(req: Request) {
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

  const body = (await req.json().catch(() => null)) as TextToSpeechRequestBody | null;
  const text = body?.text?.trim();
  const voiceId = body?.voiceId?.trim();

  if (!text) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  if (!voiceId) {
    return Response.json({ error: "Voice ID is required" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: TTS_MODEL,
        output_format: "mp3_44100_128",
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return Response.json(
      { error: "Failed to generate speech" },
      { status: response.status }
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
