// ============================================================================
// Prospecting — Google Places (New) business finder + WhatsApp number utils
// ============================================================================
//
// The "find the customer" half of the growth tool. Searches Google Places
// for businesses by free-text query (e.g. "مصانع بلاستيك في العاشر من رمضان")
// and returns name + phone + address so the marketer can import them as
// leads (customers rows) and reach out via WhatsApp through Bot X.
//
// We use the LEGIT Places API (New) Text Search — NOT scraping. It needs
// GOOGLE_PLACES_API_KEY (Google Cloud, billing enabled; $200/mo free credit
// covers thousands of searches). The phone fields are on the "Pro" field
// mask tier.
//
// Phone normalization converts whatever Google returns ("+20 100 …",
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
// searchPlaces — Places API (New) Text Search, Egypt-scoped, Arabic.
// ----------------------------------------------------------------------------
export async function searchPlaces(
  textQuery: string,
  opts: { max?: number } = {},
): Promise<SearchOutcome> {
  const key =
    process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return {
      ok: false,
      needKey: true,
      error:
        "محتاج تضيف GOOGLE_PLACES_API_KEY من Google Cloud (Places API). مجاني لحد 200$ شهريًا.",
    };
  }

  const q = (textQuery || "").trim();
  if (q.length < 3) {
    return { ok: false, error: "اكتب كلمة بحث أوضح (مثلاً: مصانع بلاستيك العاشر من رمضان)" };
  }

  const max = Math.min(Math.max(opts.max ?? 20, 1), 20);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          // Pro field mask — phone fields are billed at the Pro tier.
          "X-Goog-FieldMask": [
            "places.displayName",
            "places.nationalPhoneNumber",
            "places.internationalPhoneNumber",
            "places.formattedAddress",
            "places.rating",
            "places.userRatingCount",
            "places.websiteUri",
            "places.primaryTypeDisplayName",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery: q,
          languageCode: "ar",
          regionCode: "EG",
          pageSize: max,
        }),
      },
    );

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as {
          error?: { message?: string; status?: string };
        };
        if (body?.error?.message) detail = body.error.message;
      } catch {
        // ignore — keep the HTTP status
      }
      // Most common operator errors → friendly Arabic.
      if (res.status === 403 || /API key|permission|denied|not authorized|enable/i.test(detail)) {
        return {
          ok: false,
          error:
            "مفتاح Google مرفوض أو Places API (New) مش مفعّل. فعّل Places API في Google Cloud وتأكد إن المفتاح مسموح له. التفاصيل: " +
            detail,
        };
      }
      return { ok: false, error: "Google رفض الطلب: " + detail };
    }

    const data = (await res.json()) as {
      places?: Array<{
        displayName?: { text?: string };
        nationalPhoneNumber?: string;
        internationalPhoneNumber?: string;
        formattedAddress?: string;
        rating?: number;
        userRatingCount?: number;
        websiteUri?: string;
        primaryTypeDisplayName?: { text?: string };
      }>;
    };

    const results: ProspectResult[] = (data.places ?? []).map((p) => {
      const phoneRaw =
        p.internationalPhoneNumber || p.nationalPhoneNumber || null;
      const phone = toWhatsAppNumber(phoneRaw);
      return {
        name: (p.displayName?.text || "بدون اسم").trim(),
        phone,
        phoneRaw,
        isMobile: isLikelyMobile(phone),
        address: p.formattedAddress?.trim() || null,
        rating: typeof p.rating === "number" ? p.rating : null,
        ratingCount:
          typeof p.userRatingCount === "number" ? p.userRatingCount : null,
        website: p.websiteUri?.trim() || null,
        category: p.primaryTypeDisplayName?.text?.trim() || null,
      };
    });

    return { ok: true, results };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/abort/i.test(msg)) {
      return { ok: false, error: "بحث Google استغرق وقت طويل، جرّب تاني" };
    }
    return { ok: false, error: "تعذّر الاتصال بـ Google: " + msg.slice(0, 120) };
  } finally {
    clearTimeout(timer);
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
