const MAX_CACHED_READ_ALOUD = 50;

const cache = new Map<string, string>();

export function readAloudCacheKey(messageId: string, voiceId: string) {
  return `${messageId}:${voiceId}`;
}

export function getReadAloudAudioCache(key: string) {
  const objectUrl = cache.get(key);
  if (!objectUrl) {
    return undefined;
  }

  cache.delete(key);
  cache.set(key, objectUrl);
  return objectUrl;
}

export function setReadAloudAudioCache(key: string, objectUrl: string) {
  const existing = cache.get(key);
  if (existing && existing !== objectUrl) {
    URL.revokeObjectURL(existing);
  }

  cache.delete(key);
  cache.set(key, objectUrl);

  while (cache.size > MAX_CACHED_READ_ALOUD) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }

    const oldestUrl = cache.get(oldestKey);
    cache.delete(oldestKey);
    if (oldestUrl) {
      URL.revokeObjectURL(oldestUrl);
    }
  }
}

export function clearReadAloudAudioCache() {
  for (const objectUrl of cache.values()) {
    URL.revokeObjectURL(objectUrl);
  }
  cache.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", clearReadAloudAudioCache);
}
