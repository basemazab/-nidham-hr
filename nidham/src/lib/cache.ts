// Centralised cache-invalidation helpers + Redis caching layer.
//
// Every server action that mutates business data needs to bust the
// dashboard cache so the user sees fresh data on the next navigation.
// Individual revalidatePath() calls drift -- one action remembers to
// revalidate /dashboard/employees, another forgets /dashboard/reports/
// bridge, the result is the "I updated X but Y still shows the old
// value" class of bug.
//
// bustDashboardCache() revalidates the /dashboard layout, which
// transitively busts every /dashboard/* page using it. Targeted
// revalidatePath calls for the specific page being edited are still
// fine on top of this -- they handle the page's own immediate
// re-render -- but every mutation should call this helper as a
// catch-all for cross-cutting consumers (home counts, reports,
// /admin tables, etc).

import { revalidatePath } from "next/cache";
import { Redis } from "@upstash/redis";

const DEFAULT_TTL = 60;

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

/**
 * Revalidate the whole /dashboard subtree. Use after any mutation
 * that modifies employees / customers / payroll / attendance /
 * requests / contracts / jobs / interactions.
 */
export function bustDashboardCache(): void {
  revalidatePath("/dashboard", "layout");
}

/**
 * Bust both the company-facing dashboard AND the super-admin panel.
 * Use after subscription / billing changes that affect both sides.
 */
export function bustAllSurfaces(): void {
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin", "layout");
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttl });
  } catch {
    // silent
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // silent
  }
}

export async function cacheGetOrSet<T>(
  key: string,
  fetch: () => Promise<T>,
  ttl = DEFAULT_TTL,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const value = await fetch();
  if (value !== null && value !== undefined) {
    await cacheSet(key, value, ttl);
  }
  return value;
}

export function cacheKey(parts: string[]): string {
  return `nidham:${parts.join(":")}`;
}
