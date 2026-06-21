// ============================================================================
// /api/og — Open Graph image for public job pages (1200×630 PNG)
// ============================================================================
//
// A premium, share-ready job ad card. Renders via next/og ImageResponse with
// the Tajawal Arabic font bundled next to this file so the title shapes
// correctly on every scraper (Facebook / WhatsApp / LinkedIn).
//
// Params:
//   title    — job title (the hero)
//   theme    — one of THEMES keys (the job page derives one per job, so the
//              set of ads looks varied + professional)
//   company  — company name (brand row)
//   salary   — salary range label   ┐
//   location — city / governorate   ├─ rendered as info chips (more info → more clicks)
//   type     — job type label        ┘
//
// RTL note: Satori lays out LTR-base and mangles bidi, so we render each line
// as a `row-reverse` flex of words (logical order shown right→left, each word
// shaped correctly). Harakat misposition in Satori → brand mark is نظام.

import { ImageResponse } from "next/og";

export const runtime = "edge";

type Theme = {
  bg: string;
  grad: string;
  accent: string;
  title: string;
  sub: string;
  badgeBg: string;
  badgeBd: string;
  badgeTx: string;
  ctaBg: string;
  ctaTx: string;
  chipBg: string;
  chipBd: string;
  chipTx: string;
  brand: string;
  site: string;
};

const THEMES: Record<string, Theme> = {
  // Classic corporate — navy + gold
  navy: {
    bg: "#0D1B2A",
    grad:
      "radial-gradient(circle at 85% 15%, rgba(201,168,76,0.20) 0%, rgba(201,168,76,0) 45%), radial-gradient(circle at 10% 90%, rgba(13,148,136,0.28) 0%, rgba(13,148,136,0) 52%)",
    accent: "#C9A84C",
    title: "#ffffff",
    sub: "rgba(255,255,255,0.78)",
    badgeBg: "rgba(16,185,129,0.15)",
    badgeBd: "rgba(16,185,129,0.45)",
    badgeTx: "#34d399",
    ctaBg: "#C9A84C",
    ctaTx: "#0D1B2A",
    chipBg: "rgba(255,255,255,0.08)",
    chipBd: "rgba(255,255,255,0.20)",
    chipTx: "#ffffff",
    brand: "#C9A84C",
    site: "rgba(255,255,255,0.5)",
  },
  // Fresh & modern — emerald / teal
  emerald: {
    bg: "#06281f",
    grad:
      "radial-gradient(circle at 85% 12%, rgba(52,211,153,0.26) 0%, rgba(52,211,153,0) 48%), radial-gradient(circle at 8% 92%, rgba(34,211,238,0.20) 0%, rgba(34,211,238,0) 54%)",
    accent: "#34d399",
    title: "#ffffff",
    sub: "rgba(255,255,255,0.78)",
    badgeBg: "rgba(250,204,21,0.14)",
    badgeBd: "rgba(250,204,21,0.42)",
    badgeTx: "#fde047",
    ctaBg: "#34d399",
    ctaTx: "#06281f",
    chipBg: "rgba(255,255,255,0.08)",
    chipBd: "rgba(255,255,255,0.20)",
    chipTx: "#ffffff",
    brand: "#6ee7b7",
    site: "rgba(255,255,255,0.5)",
  },
  // Bold & premium — royal indigo
  royal: {
    bg: "#1e1b4b",
    grad:
      "radial-gradient(circle at 85% 12%, rgba(167,139,250,0.30) 0%, rgba(167,139,250,0) 48%), radial-gradient(circle at 8% 92%, rgba(34,211,238,0.20) 0%, rgba(34,211,238,0) 54%)",
    accent: "#a78bfa",
    title: "#ffffff",
    sub: "rgba(255,255,255,0.78)",
    badgeBg: "rgba(34,211,238,0.14)",
    badgeBd: "rgba(34,211,238,0.42)",
    badgeTx: "#67e8f9",
    ctaBg: "#a78bfa",
    ctaTx: "#1e1b4b",
    chipBg: "rgba(255,255,255,0.08)",
    chipBd: "rgba(255,255,255,0.22)",
    chipTx: "#ffffff",
    brand: "#c4b5fd",
    site: "rgba(255,255,255,0.5)",
  },
  // Minimal & elegant — clean light
  light: {
    bg: "#f6f7f9",
    grad:
      "radial-gradient(circle at 88% 12%, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0) 45%), radial-gradient(circle at 6% 94%, rgba(8,145,178,0.14) 0%, rgba(8,145,178,0) 52%)",
    accent: "#0891b2",
    title: "#0D1B2A",
    sub: "rgba(15,23,42,0.62)",
    badgeBg: "rgba(8,145,178,0.10)",
    badgeBd: "rgba(8,145,178,0.35)",
    badgeTx: "#0e7490",
    ctaBg: "#0D1B2A",
    ctaTx: "#ffffff",
    chipBg: "rgba(13,27,42,0.05)",
    chipBd: "rgba(13,27,42,0.12)",
    chipTx: "#0D1B2A",
    brand: "#0D1B2A",
    site: "rgba(15,23,42,0.45)",
  },
};

function RtlLine({
  text,
  style = {},
}: {
  text: string;
  style?: Record<string, unknown>;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row-reverse",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        ...style,
      }}
    >
      {text.split(/\s+/).map((w, i) => (
        <span key={i}>{w}</span>
      ))}
    </div>
  );
}

// Fonts load ONCE per isolate (module scope) — keeps renders ~1.4s so the
// scraper never times out. s-maxage below lets Vercel's CDN serve repeats hot.
const fontsPromise = Promise.all([
  fetch(new URL("./Tajawal-Bold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
  fetch(new URL("./Tajawal-Regular.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "تقديم على وظيفة").slice(0, 80);
  const company = (searchParams.get("company") || "").slice(0, 40);
  const salary = (searchParams.get("salary") || "").slice(0, 40);
  const location = (searchParams.get("location") || "").slice(0, 40);
  const jobType = (searchParams.get("type") || "").slice(0, 30);
  const t = THEMES[searchParams.get("theme") || "navy"] ?? THEMES.navy;

  const chips = [
    salary ? `💰 ${salary}` : "",
    location ? `📍 ${location}` : "",
    jobType ? `🕐 ${jobType}` : "",
  ].filter(Boolean);

  const [bold, regular] = await fontsPromise;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: t.bg,
          backgroundImage: t.grad,
          fontFamily: "Tajawal",
          padding: "46px 64px",
        }}
      >
        {/* Top brand row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 8, height: 42, borderRadius: 4, backgroundColor: t.accent }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: t.brand }}>
                {company || "نظام"}
              </div>
              <div style={{ fontSize: 13, color: t.site, letterSpacing: 4 }}>
                {company ? "عبر نِظام · NIDHAM HR" : "NIDHAM HR"}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              backgroundColor: t.badgeBg,
              border: `1px solid ${t.badgeBd}`,
              color: t.badgeTx,
              borderRadius: 999,
              padding: "10px 26px",
            }}
          >
            <RtlLine text="فرصة عمل جديدة 🔥" style={{ fontSize: 22, fontWeight: 700, gap: 8 }} />
          </div>
        </div>

        {/* Job title — the hero */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, maxWidth: 1050 }}>
          <RtlLine
            text={title}
            style={{
              fontSize: title.length > 38 ? 54 : 70,
              fontWeight: 700,
              color: t.title,
              lineHeight: 1.22,
              gap: 18,
            }}
          />
          {/* Info chips */}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              {chips.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    backgroundColor: t.chipBg,
                    border: `1px solid ${t.chipBd}`,
                    color: t.chipTx,
                    borderRadius: 12,
                    padding: "8px 20px",
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
          )}
          {chips.length === 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 4, borderRadius: 2, backgroundColor: t.accent }} />
              <RtlLine text="التقديم أونلاين في دقيقتين" style={{ fontSize: 26, color: t.sub, gap: 8 }} />
              <div style={{ width: 46, height: 4, borderRadius: 2, backgroundColor: t.accent }} />
            </div>
          )}
        </div>

        {/* CTA bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div
            style={{
              display: "flex",
              backgroundColor: t.ctaBg,
              color: t.ctaTx,
              borderRadius: 16,
              padding: "16px 40px",
              boxShadow: `0 8px 30px ${t.accent}55`,
            }}
          >
            <RtlLine text="اضغط اللينك وقدّم دلوقتي 👇" style={{ fontSize: 28, fontWeight: 700, gap: 10 }} />
          </div>
          <div style={{ display: "flex", fontSize: 22, color: t.site }}>nidhamhr.com</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Tajawal", data: bold, weight: 700, style: "normal" },
        { name: "Tajawal", data: regular, weight: 400, style: "normal" },
      ],
      headers: {
        "cache-control": "public, max-age=86400, s-maxage=31536000",
      },
    },
  );
}
