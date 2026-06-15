import { Redis } from "@upstash/redis";

type Bucket = {
  tokens: number;
  resetAt: number;
};

const BUCKETS = new Map<string, Bucket>();
let lastTrim = 0;

function trimIfDue(now: number) {
  if (now - lastTrim < 60_000) return;
  lastTrim = now;
  for (const [key, b] of BUCKETS) {
    if (b.resetAt < now) BUCKETS.delete(key);
  }
}

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 5 * 60_000,
): RateLimitResult {
  const now = Date.now();
  trimIfDue(now);

  let b = BUCKETS.get(key);
  if (!b || b.resetAt < now) {
    b = { tokens: limit, resetAt: now + windowMs };
    BUCKETS.set(key, b);
  }

  if (b.tokens <= 0) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }

  b.tokens -= 1;
  return { ok: true, remaining: b.tokens, resetAt: b.resetAt };
}

export async function checkRateLimitRedis(
  key: string,
  limit = 20,
  windowMs = 5 * 60_000,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (!redis) return checkRateLimit(key, limit, windowMs);

  try {
    const rk = `ratelimit:${key}`;
    const window = Math.ceil(windowMs / 1000);
    const current = await redis.incr(rk);
    if (current === 1) await redis.expire(rk, window);
    const ttl = await redis.ttl(rk);

    if (current > limit) {
      return { ok: false, retryAfterSeconds: Math.max(1, ttl) };
    }

    return { ok: true, remaining: limit - current, resetAt: Date.now() + ttl * 1000 };
  } catch {
    return checkRateLimit(key, limit, windowMs);
  }
}

export function checkInvitationClaimRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`invite:ip:${ip}`, 8, 60 * 60_000);
}

export function checkPasswordResetRateLimit(
  ip: string,
  email: string | null | undefined,
): RateLimitResult {
  const ipResult = checkRateLimit(`reset:ip:${ip}`, 20, 60 * 60_000);
  if (!ipResult.ok) return ipResult;

  if (email && email.trim()) {
    const emailResult = checkRateLimit(
      `reset:email:${email.trim().toLowerCase()}`,
      5,
      60 * 60_000,
    );
    if (!emailResult.ok) return emailResult;
  }
  return ipResult;
}

export function checkPasswordUpdateRateLimit(ip: string): RateLimitResult {
  return checkRateLimit(`pwupdate:ip:${ip}`, 10, 15 * 60_000);
}

export function checkLoginRateLimit(
  ip: string,
  email: string | null | undefined,
): RateLimitResult {
  const ipResult = checkRateLimit(`login:ip:${ip}`, 10, 60 * 60_000);
  if (!ipResult.ok) return ipResult;

  if (email && email.trim()) {
    const emailResult = checkRateLimit(
      `login:email:${email.trim().toLowerCase()}`,
      5,
      15 * 60_000,
    );
    if (!emailResult.ok) return emailResult;
  }
  return ipResult;
}
