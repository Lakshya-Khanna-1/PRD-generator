import "server-only";

/**
 * In-memory fixed-window rate limiter, keyed by an arbitrary string (e.g. IP).
 * Good enough for a single-instance pre-auth abuse guard; swap for a durable
 * store (e.g. Upstash Redis) before running multiple server instances.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Cheap safeguard against unbounded memory growth on a long-lived instance.
const MAX_TRACKED_KEYS = 5000;

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStart >= config.windowMs) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      buckets.clear();
    }
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.max - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= config.max) {
    const retryAfterSeconds = Math.ceil((config.windowMs - (now - existing.windowStart)) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: config.max - existing.count, retryAfterSeconds: 0 };
}
