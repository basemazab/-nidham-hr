/**
 * Shared helpers for parsing FormData in server actions.
 * Eliminates the `asText` / `asNumber` duplication across ~30 actions.ts files.
 */

export function asText(value: FormDataEntryValue | null): string | null {
  if (value === null || typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function asNumber(value: FormDataEntryValue | null): number | null {
  const text = asText(value);
  if (text === null) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

export function asPositiveNumber(value: FormDataEntryValue | null): number | null {
  const n = asNumber(value);
  if (n === null || n <= 0) return null;
  return n;
}

/**
 * Like asPositiveNumber but defaults to 0 instead of null.
 * Strips non-numeric characters (handles Arabic numerals, thousand separators).
 */
export function asPositiveNumberOrDefault(value: FormDataEntryValue | null): number {
  if (value === null) return 0;
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n;
}

export function asEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
): T {
  const text = asText(value);
  if (text && (allowed as readonly string[]).includes(text)) return text as T;
  return fallback;
}

export function asBoolean(value: FormDataEntryValue | null): boolean {
  const text = asText(value);
  if (text === null) return false;
  return text === "true" || text === "1" || text === "on";
}

export function asDate(value: FormDataEntryValue | null): string | null {
  const text = asText(value);
  if (text === null) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export function asUUID(value: FormDataEntryValue | null): string | null {
  const text = asText(value);
  if (text === null) return null;
  return /^[0-9a-f-]{36}$/i.test(text) ? text : null;
}
