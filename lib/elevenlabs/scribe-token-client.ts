let prefetchPromise: Promise<string> | null = null;

async function fetchScribeToken(): Promise<string> {
  const response = await fetch("/api/elevenlabs/scribe-token", {
    method: "POST",
  });
  const data = (await response.json().catch(() => null)) as {
    token?: string;
    error?: string;
  } | null;

  if (!response.ok || !data?.token) {
    throw new Error(data?.error ?? "Failed to start dictation");
  }

  return data.token;
}

export function prefetchScribeToken() {
  if (!prefetchPromise) {
    prefetchPromise = fetchScribeToken().catch((error) => {
      prefetchPromise = null;
      throw error;
    });
  }

  return prefetchPromise;
}

export async function getScribeToken(): Promise<string> {
  if (prefetchPromise) {
    const promise = prefetchPromise;
    prefetchPromise = null;

    try {
      return await promise;
    } catch {
      return fetchScribeToken();
    }
  }

  return fetchScribeToken();
}
