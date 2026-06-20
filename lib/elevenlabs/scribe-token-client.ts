import {
  dictationLog,
  type DictationSession,
} from "@/lib/elevenlabs/dictation-debug";
import { warmMicrophoneAccess } from "@/lib/elevenlabs/warm-microphone";

let prefetchPromise: Promise<string> | null = null;

async function fetchScribeToken(session: DictationSession | null = null) {
  dictationLog(session, "token fetch started");

  const response = await fetch("/api/elevenlabs/scribe-token", {
    method: "POST",
  });
  const data = (await response.json().catch(() => null)) as {
    token?: string;
    error?: string;
  } | null;

  if (!response.ok || !data?.token) {
    dictationLog(session, "token fetch failed", {
      status: response.status,
      error: data?.error,
    });
    throw new Error(data?.error ?? "Failed to start dictation");
  }

  dictationLog(session, "token fetch complete", {
    tokenLength: data.token.length,
  });
  return data.token;
}

export function prefetchScribeToken() {
  if (!prefetchPromise) {
    dictationLog(null, "token prefetch started");
    prefetchPromise = fetchScribeToken()
      .then((token) => {
        dictationLog(null, "token prefetch complete");
        return token;
      })
      .catch((error) => {
        prefetchPromise = null;
        dictationLog(null, "token prefetch failed", error);
        throw error;
      });
  }

  return prefetchPromise;
}

export function warmDictation(
  microphone: {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  } = {
    echoCancellation: true,
    noiseSuppression: true,
  }
) {
  prefetchScribeToken();
  void warmMicrophoneAccess(microphone);
}

export async function getScribeToken(
  session: DictationSession | null = null
): Promise<string> {
  let token: string;

  if (prefetchPromise) {
    dictationLog(session, "token cache hit (prefetched)");
    const promise = prefetchPromise;
    prefetchPromise = null;

    try {
      token = await promise;
    } catch {
      dictationLog(session, "prefetched token failed, refetching");
      token = await fetchScribeToken(session);
    }
  } else {
    dictationLog(session, "token cache miss");
    token = await fetchScribeToken(session);
  }

  prefetchScribeToken();
  return token;
}
