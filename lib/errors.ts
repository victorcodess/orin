const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Failed to process chat request";
}

/** Parse AI SDK stream errors that arrive as JSON strings. */
export function getChatErrorMessage(error: Error): string {
  try {
    const parsed = JSON.parse(error.message) as {
      error?: { type?: string; message?: string };
    };

    if (parsed.error?.type === "server_error") {
      return "OpenAI had a temporary issue. Try sending again.";
    }

    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {
    // Not JSON.
  }

  return error.message;
}
