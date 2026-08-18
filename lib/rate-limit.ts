/**
 * Fixed-window rate limiting held in process memory.
 *
 * On serverless this is per-instance and therefore best-effort: it stops a
 * single client hammering one instance, not a distributed attack. Upgrade path
 * is a Supabase table with an atomic increment RPC.
 */

export interface RateLimitRule {
  /** Namespace so different routes do not share a counter. */
  key: string;
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

const MAX_TRACKED_KEYS = 5000;

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'anon';
}

function evictExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(req: Request, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const key = `${rule.key}:${clientKey(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) evictExpired(now);
    // Still full of live entries — drop the oldest rather than grow unbounded.
    if (buckets.size >= MAX_TRACKED_KEYS) {
      const oldest = buckets.keys().next().value;
      if (oldest !== undefined) buckets.delete(oldest);
    }
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, remaining: rule.max - 1, retryAfterSec: 0 };
  }

  bucket.count += 1;
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > rule.max) {
    return { ok: false, remaining: 0, retryAfterSec };
  }

  return { ok: true, remaining: rule.max - bucket.count, retryAfterSec: 0 };
}

/** Rejects oversized bodies using Content-Length before they are parsed. */
export function exceedsBodyLimit(req: Request, maxBytes: number): boolean {
  const declared = Number(req.headers.get('content-length'));
  return Number.isFinite(declared) && declared > maxBytes;
}

export function tooManyRequests(retryAfterSec: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSec),
    },
  });
}

export function payloadTooLarge(message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 413,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const RATE_LIMITS = {
  reviews: { key: 'reviews', windowMs: 60 * 60 * 1000, max: 5 },
  visits: { key: 'visits', windowMs: 10 * 60 * 1000, max: 120 },
  roastCv: { key: 'roast-cv', windowMs: 10 * 60 * 1000, max: 5 },
  cv: { key: 'cv', windowMs: 10 * 60 * 1000, max: 20 },
  applicationLetter: { key: 'application-letter', windowMs: 10 * 60 * 1000, max: 10 },
  media: { key: 'media', windowMs: 10 * 60 * 1000, max: 30 },
  safety: { key: 'safety', windowMs: 10 * 60 * 1000, max: 10 },
} as const satisfies Record<string, RateLimitRule>;

export const BODY_LIMITS = {
  reviews: 4 * 1024,
  visits: 2 * 1024,
  cv: 2 * 1024 * 1024,
  applicationLetter: 48 * 1024,
  roastCv: 10 * 1024 * 1024,
  media: 15 * 1024 * 1024,
  safety: 8 * 1024,
} as const;
