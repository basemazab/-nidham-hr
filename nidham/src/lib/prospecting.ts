// ============================================================================
// Prospecting — Google Maps business finder (via Apify) + WhatsApp number utils
// ============================================================================
//
// The "find the customer" half of the growth tool. Finds businesses by
// free-text query (e.g. "مصانع بلاستيك في العاشر من رمضان") and returns name +
// phone + address so the marketer can import them as leads and reach out.
//
// Data source: the Apify "compass/crawler-google-places" actor via the
// run-sync-get-dataset-items endpoint. Needs APIFY_TOKEN only (apify.com →
// Settings → API tokens) — FREE tier, NO credit card required (chosen because
// Google Places billing rejected the owner's card). Pay-per-event pricing is
// covered by Apify's monthly free credit.
//
// Phone normalization converts whatever the source returns ("+20 100 …",
// "010 …") into the bare international form WhatsApp + Bot X expect
// ("201001234567"). Non-Egyptian numbers are dropped so we never message
// the wrong country.

export type ProspectResult = {
  /** Business / place name (becomes customers.full_name). */
  name: string;
  /** Normalized WhatsApp number ("2010…") or null if unusable. */
  phone: string | null;
  /** Raw phone as Google returned it (for display). */
  phoneRaw: string | null;
  /** True when the normalized number looks like an EG mobile (has WhatsApp). */
  isMobile: boolean;
  address: string | null;
  rating: number | null;
  ratingCount: number | null;
  website: string | null;
  category: string | null;
};

export type SearchOutcome =
  | { ok: true; results: ProspectResult[] }
  | { ok: false; error: string; needKey?: boolean };

// ----------------------------------------------------------------------------
// toWhatsAppNumber — normalize an Egyptian phone to bare E.164 digits.
// Returns null for empty / non-Egyptian / unusable input.
//   "+20 100 123 4567" -> "201001234567"
//   "01001234567"      -> "201001234567"
//   "1001234567"       -> "201001234567"
//   "+966 50 …"        -> null   (not Egypt — don't message wrong country)
// ----------------------------------------------------------------------------
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const hadPlus = raw.trim().startsWith("+");
  let d = raw.replace(/\D/g, "");
  if (!d) return null;

  if (hadPlus || d.startsWith("20")) {
    // Already has a country code. Only accept Egypt.
    if (!d.startsWith("20")) return null;
    // Guard against absurd lengths.
    return d.length >= 10 && d.length <= 13 ? d : null;
  }

  // National form — strip a single trunk 0 then prepend EG country code.
  if (d.startsWith("0")) d = d.slice(1);
  d = "20" + d;
  return d.length >= 10 && d.length <= 13 ? d : null;
}

// EG mobiles are 20 + 1X + 8 digits = 12 digits starting "201". Landlines
// (20 + area + number) don't carry WhatsApp, so the export can skip them.
export function isLikelyMobile(wa: string | null): boolean {
  return !!wa && wa.startsWith("201") && wa.length === 12;
}

// ----------------------------------------------------------------------------
// searchPlaces — Google Maps text search via Apify (free tier, no card).
// Runs compass/crawler-google-places through run-sync-get-dataset-items so a
// single HTTP call returns the rows. We cap the actor run (timeout) and abort
// the fetch a bit later to stay within the serverless limit. Needs APIFY_TOKEN.
// ----------------------------------------------------------------------------
export async function searchPlaces(
  textQuery: string,
  opts: { max?: number } = {},
): Promise<SearchOutcome> {
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_TOKEN;
  if (!token) {
    return {
      ok: false,
      needKey: true,
      error: "محتاج تضيف APIFY_TOKEN (مجاني تمامًا، بدون كارت) عشان البحث يشتغل.",
    };
  }

  const q = (textQuery || "").trim();
  if (q.length < 3) {
    return { ok: false, error: "اكتب كلمة بحث أوضح (مثلاً: مصانع بلاستيك العاشر من رمضان)" };
  }

  const max = Math.min(Math.max(opts.max ?? 20, 1), 20);
  const actor = "compass~crawler-google-places";
  const url =
    `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items` +
    `?token=${encodeURIComponent(token)}&timeout=55`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Cap the wait just above the actor timeout so a hung run can't exceed
      // the serverless function budget.
      signal: AbortSignal.timeout(58000),
      body: JSON.stringify({
        searchStringsArray: [q],
        maxCrawledPlacesPerSearch: max,
        language: "ar",
        countryCode: "eg",
        skipClosedPlaces: false,
        maxImages: 0,
      }),
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        if (body?.error?.message) detail = body.error.message;
      } catch {
        // ignore — keep the HTTP status
      }
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          needKey: true,
          error: "توكن Apify غير صالح أو ناقص — راجع APIFY_TOKEN في Vercel.",
        };
      }
      if (res.status === 402) {
        return { ok: false, error: "رصيد Apify المجاني خلص الشهر ده — جرّب الشهر الجاي أو رقّي خطة Apify." };
      }
      if (res.status === 408) {
        return { ok: false, error: "البحث أخذ وقت طويل — جرّب نتائج أقل أو كلمة أوضح وحاول تاني." };
      }
      return { ok: false, error: "تعذّر البحث عبر Apify: " + detail.slice(0, 160) };
    }

    const items = (await res.json()) as Array<{
      title?: string;
      phone?: string;
      phoneUnformatted?: string;
      address?: string;
      street?: string;
      website?: string;
      totalScore?: number;
      reviewsCount?: number;
      categoryName?: string;
    }>;

    const results: ProspectResult[] = (items ?? [])
      .filter((p) => p && p.title)
      .map((p) => {
        const phoneRaw = p.phone || p.phoneUnformatted || null;
        const phone = toWhatsAppNumber(phoneRaw);
        const address = (p.address || p.street || "").trim() || null;
        return {
          name: (p.title || "بدون اسم").trim(),
          phone,
          phoneRaw,
          isMobile: isLikelyMobile(phone),
          address,
          rating: typeof p.totalScore === "number" ? p.totalScore : null,
          ratingCount: typeof p.reviewsCount === "number" ? p.reviewsCount : null,
          website: p.website?.trim() || null,
          category: p.categoryName?.trim() || null,
        };
      });

    return { ok: true, results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/abort|timeout/i.test(msg)) {
      return { ok: false, error: "البحث أخذ وقت طويل — جرّب نتائج أقل أو كلمة أوضح." };
    }
    return { ok: false, error: "تعذّر الاتصال بـ Apify: " + msg.slice(0, 120) };
  }
}

// ----------------------------------------------------------------------------
// buildBotXCsv — produce a Bot-X-ready contacts CSV (الرقم,الاسم).
// Numbers are already normalized; we dedupe, optionally keep mobiles only
// (landlines have no WhatsApp), and strip commas/newlines from names so the
// single-comma-per-line format stays intact for naive parsers.
// ----------------------------------------------------------------------------
export function buildBotXCsv(
  rows: Array<{ name: string | null; wa: string | null }>,
  opts: { mobileOnly?: boolean } = {},
): { csv: string; count: number } {
  const mobileOnly = opts.mobileOnly ?? true;
  const seen = new Set<string>();
  const lines: string[] = ["الرقم,الاسم"];

  for (const r of rows) {
    const wa = (r.wa || "").replace(/\D/g, "");
    if (!wa) continue;
    if (mobileOnly && !isLikelyMobile(wa)) continue;
    if (seen.has(wa)) continue;
    seen.add(wa);
    const name = (r.name || "عميل").replace(/[,\n\r]+/g, " ").trim() || "عميل";
    lines.push(`${wa},${name}`);
  }

  return { csv: lines.join("\n") + "\n", count: seen.size };
}

// ----------------------------------------------------------------------------
// parseManualContacts — turn pasted text into {name, phone} pairs.
// Works without the Google key: the user pastes lines like
//   "شركة الأمل 01001234567"  |  "01112223334"  |  "مصنع كذا, 010..."
// We pull the first phone-looking run from each line; the rest is the name.
// ----------------------------------------------------------------------------
export function parseManualContacts(
  text: string,
): Array<{ name: string | null; phone: string }> {
  const out: Array<{ name: string | null; phone: string }> = [];
  for (const rawLine of (text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(/\+?\d[\d\s().-]{7,}\d/);
    if (!m) continue;
    const phone = m[0];
    const idx = m.index ?? 0;
    const name =
      (line.slice(0, idx) + " " + line.slice(idx + phone.length))
        .replace(/[,;|\t]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() || null;
    out.push({ name, phone });
  }
  return out;
}
