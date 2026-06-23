export async function fetchReadAloudAudio(
  text: string,
  voiceId: string
): Promise<string> {
  const response = await fetch("/api/elevenlabs/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(data?.error ?? "Failed to generate speech");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
