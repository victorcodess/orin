import "server-only";

const VALIDATION_TIMEOUT_MS = 8_000;

type ValidationResult = {
  valid: boolean;
  error?: string;
};

async function verifyKey(
  url: string,
  headers: Record<string, string>,
  provider: string,
): Promise<ValidationResult> {
  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(VALIDATION_TIMEOUT_MS),
    });

    if (response.ok) {
      return { valid: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: `${provider} rejected this API key` };
    }

    return {
      valid: false,
      error: `Could not verify ${provider} API key. Try again in a moment.`,
    };
  } catch {
    return {
      valid: false,
      error: `Could not reach ${provider} to verify this key. Try again in a moment.`,
    };
  }
}

export async function validateOpenAIKey(key: string): Promise<ValidationResult> {
  return verifyKey(
    "https://api.openai.com/v1/models",
    { Authorization: `Bearer ${key}` },
    "OpenAI",
  );
}

export async function validateElevenLabsKey(
  key: string,
): Promise<ValidationResult> {
  return verifyKey(
    "https://api.elevenlabs.io/v1/user",
    { "xi-api-key": key },
    "ElevenLabs",
  );
}
