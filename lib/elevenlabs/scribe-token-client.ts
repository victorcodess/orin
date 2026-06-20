import {
  dictationLog,
  type DictationSession,
} from "@/lib/elevenlabs/dictation-debug";
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
    dictationLog(null, "token prefetch expired");
    prefetchCache = null;
  }
}

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
  clearPrefetchIfStale();

  if (!prefetchCache) {
    const startedAt = Date.now();
    dictationLog(null, "token prefetch started");

    prefetchCache = {
      startedAt,
      promise: fetchScribeToken()
        .then((token) => {
          if (isPrefetchStale(startedAt)) {
            prefetchCache = null;
            dictationLog(null, "token prefetch completed but expired");
            throw new Error("Prefetched token expired");
          }
          dictationLog(null, "token prefetch complete");
          return token;
        })
        .catch((error) => {
          if (prefetchCache?.startedAt === startedAt) {
            prefetchCache = null;
          }
          dictationLog(null, "token prefetch failed", error);
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
  }
) {
  prefetchDictationToken();
  void warmMicrophoneAccess(microphone);
}

export async function getScribeToken(
  session: DictationSession | null = null
): Promise<string> {
  clearPrefetchIfStale();

  let token: string;
  const cached = prefetchCache;

  if (cached) {
    dictationLog(session, "token cache hit (prefetched)");
    prefetchCache = null;

    try {
      token = await cached.promise;
      if (isPrefetchStale(cached.startedAt)) {
        dictationLog(session, "prefetched token stale after resolve, refetching");
        token = await fetchScribeToken(session);
      }
    } catch {
      dictationLog(session, "prefetched token failed, refetching");
      token = await fetchScribeToken(session);
    }
  } else {
    dictationLog(session, "token cache miss");
    token = await fetchScribeToken(session);
  }

  prefetchDictationToken();
  return token;
}
