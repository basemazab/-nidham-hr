// ============================================================================
// /api/og?title=... — Open Graph image for public job pages (1200×630 PNG)
// ============================================================================
//
// History: this used to return a raw SVG with `system-ui` text. Facebook's
// scraper can't shape Arabic in SVGs → titles rendered as hex tofu boxes
// (06 2A 06 27 …) on every shared job link. Now it's a real PNG via
// next/og ImageResponse with the Tajawal Arabic font bundled next to this
// file, so the title renders correctly everywhere (FB/WhatsApp/LinkedIn).
//
// RTL: Satori lays text out with an LTR base direction and mangles bidi
// control chars (RLE reversed letters INSIDE the first word). The reliable
// fix is word-level layout: split each line into words and render them in a
// `row-reverse` flex row — logical word order displayed right→left, while
// each single word is one direction so its glyph shaping stays correct.
// Harakat also misposition in Satori, so the brand mark is نظام (no kasra).

import { ImageResponse } from "next/og";

export const runtime = "edge";

const GOLD = "#C9A84C";
const NAVY = "#0D1B2A";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get("title") || "تقديم على وظيفة").slice(0, 80);

  const [bold, regular] = await Promise.all([
    fetch(new URL("./Tajawal-Bold.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
    fetch(new URL("./Tajawal-Regular.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
  ]);

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
          backgroundColor: NAVY,
          backgroundImage:
            "radial-gradient(circle at 85% 15%, rgba(201,168,76,0.18) 0%, rgba(201,168,76,0) 45%), radial-gradient(circle at 10% 90%, rgba(13,148,136,0.25) 0%, rgba(13,148,136,0) 50%)",
          fontFamily: "Tajawal",
          padding: "48px 64px",
        }}
      >
        {/* Top brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 8,
                height: 40,
                borderRadius: 4,
                backgroundColor: GOLD,
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontSize: 34, fontWeight: 700, color: GOLD }}>
                نظام
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: 4,
                }}
              >
                NIDHAM HR
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              backgroundColor: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.45)",
              color: "#34d399",
              borderRadius: 999,
              padding: "10px 26px",
            }}
          >
            <RtlLine
              text="فرصة عمل جديدة 🔥"
              style={{ fontSize: 22, fontWeight: 700, gap: 8 }}
            />
          </div>
        </div>

        {/* Job title — the hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
            maxWidth: 1040,
          }}
        >
          <RtlLine
            text={title}
            style={{
              fontSize: title.length > 35 ? 56 : 68,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.25,
              gap: 18,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{ width: 46, height: 4, borderRadius: 2, backgroundColor: GOLD }}
            />
            <RtlLine
              text="التقديم أونلاين في دقيقتين من موبايلك"
              style={{ fontSize: 26, color: "rgba(255,255,255,0.75)", gap: 8 }}
            />
            <div
              style={{ width: 46, height: 4, borderRadius: 2, backgroundColor: GOLD }}
            />
          </div>
        </div>

        {/* CTA bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              backgroundColor: GOLD,
              color: NAVY,
              borderRadius: 16,
              padding: "16px 40px",
              boxShadow: "0 8px 30px rgba(201,168,76,0.4)",
            }}
          >
            <RtlLine
              text="اضغط اللينك وقدّم دلوقتي 👇"
              style={{ fontSize: 28, fontWeight: 700, gap: 10 }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            nidhamhr.com
          </div>
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
        "cache-control": "public, max-age=86400",
      },
    },
  );
}
