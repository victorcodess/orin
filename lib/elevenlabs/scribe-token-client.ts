import { warmMicrophoneAccess } from "@/lib/elevenlabs/warm-microphone";

/** Discard prefetched tokens older than this before use. */
const PREFETCH_TTL_MS = 60_000;

type PrefetchCache = {
  promise: Promise<string>;
  startedAt: number;
};

let prefetchCache: PrefetchCache | null = null;

function isPrefetchStale(startedAt: number) {
  return Date.now() - startedAt > PREFETCH_TTL_MS;
}

function clearPrefetchIfStale() {
  if (prefetchCache && isPrefetchStale(prefetchCache.startedAt)) {
    prefetchCache = null;
  }
}

async function fetchScribeToken() {
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
  clearPrefetchIfStale();

  if (!prefetchCache) {
    const startedAt = Date.now();

    prefetchCache = {
      startedAt,
      promise: fetchScribeToken()
        .then((token) => {
          if (isPrefetchStale(startedAt)) {
            prefetchCache = null;
            throw new Error("Prefetched token expired");
          }
          return token;
        })
        .catch((error) => {
          if (prefetchCache?.startedAt === startedAt) {
            prefetchCache = null;
          }
          throw error;
        }),
    };
  }

  return prefetchCache.promise;
}

/** Prefetch token only — safe for mount/focus without user gesture. */
export function prefetchDictationToken() {
  void prefetchScribeToken().catch(() => {});
}

/** Prefetch token and warm mic — use on hover or just before dictation. */
export function warmDictation(
  microphone: {
    echoCancellation?: boolean;
    noiseSuppression?: boolean;
    autoGainControl?: boolean;
  } = {
    echoCancellation: true,
    noiseSuppression: true,
  },
) {
  prefetchDictationToken();
  void warmMicrophoneAccess(microphone);
}

export async function getScribeToken(): Promise<string> {
  clearPrefetchIfStale();

  let token: string;
  const cached = prefetchCache;

  if (cached) {
    prefetchCache = null;

    try {
      token = await cached.promise;
      if (isPrefetchStale(cached.startedAt)) {
        token = await fetchScribeToken();
      }
    } catch {
      token = await fetchScribeToken();
    }
  } else {
    token = await fetchScribeToken();
  }

  prefetchDictationToken();
  return token;
}
