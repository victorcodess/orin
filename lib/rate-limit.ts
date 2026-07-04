type Bucket = { count: number; resetAt: number };
type LimitRule = { name: string; limit: number; windowMs: number };

const MINUTE = 60_000;
const buckets = new Map<string, Bucket>();

function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip") ?? "unknown";
}

function getApiLimit(pathname: string, method: string): LimitRule | null {
  if (method === "GET" || method === "HEAD") {
    return { name: "read", limit: 180, windowMs: MINUTE };
  }

  if (pathname.startsWith("/api/chat")) {
    return { name: "chat", limit: 24, windowMs: MINUTE };
  }

  if (pathname.startsWith("/api/voice/")) {
    return { name: "voice", limit: 20, windowMs: MINUTE };
  }

  if (pathname.startsWith("/api/elevenlabs/")) {
    return { name: "elevenlabs", limit: 30, windowMs: MINUTE };
  }

  return { name: "write", limit: 60, windowMs: MINUTE };
}

function hitLimit(key: string, rule: LimitRule, now: number) {
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + rule.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > rule.limit) {
    return {
      ok: false as const,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  if (buckets.size > 10_000) {
    for (const [entryKey, entry] of buckets) {
      if (now >= entry.resetAt) {
        buckets.delete(entryKey);
      }
    }
  }

  return { ok: true as const };
}

export function checkApiRateLimit(input: {
  pathname: string;
  method: string;
  headers: Headers;
}) {
  if (
    !input.pathname.startsWith("/api/") ||
    input.method === "OPTIONS"
  ) {
    return { ok: true as const };
  }

  const rule = getApiLimit(input.pathname, input.method);
  const ip = getClientIp(input.headers);
  return hitLimit(`${ip}:${rule.name}`, rule, Date.now());
}

export function resetRateLimits() {
  buckets.clear();
}
