// ============================================================================
// /api/og/linkedin-cover — LinkedIn company-page banner for نِظام (PNG)
// ============================================================================
// LinkedIn company cover spec is 1128×191; we render at 2× (2256×382) so it
// stays crisp after LinkedIn's resize. Same Tajawal setup + word-level RTL
// trick as the job OG image (Satori can't do bidi paragraphs).

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
        gap: 10,
        ...style,
      }}
    >
      {text.split(/\s+/).map((w, i) => (
        <span key={i}>{w}</span>
      ))}
    </div>
  );
}

const fontsPromise = Promise.all([
  fetch(new URL("../Tajawal-Bold.ttf", import.meta.url)).then((r) =>
    r.arrayBuffer(),
  ),
  fetch(new URL("../Tajawal-Regular.ttf", import.meta.url)).then((r) =>
    r.arrayBuffer(),
  ),
]);

export async function GET() {
  const [bold, regular] = await fontsPromise;

  const chips = [
    "🤖 مساعد HR ذكي",
    "💰 مرتبات بالقانون المصري",
    "🎯 توظيف ذكي",
    "⏰ حضور GPS وبصمة",
    "💼 CRM ومبيعات",
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: NAVY,
          backgroundImage:
            "radial-gradient(circle at 88% 30%, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0) 40%), radial-gradient(circle at 8% 80%, rgba(13,148,136,0.3) 0%, rgba(13,148,136,0) 45%), linear-gradient(105deg, #0D1B2A 0%, #11233a 55%, #0D1B2A 100%)",
          fontFamily: "Tajawal",
          padding: "0 90px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Left: chips + site */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", gap: 16 }}>
              {chips.slice(0, 3).map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(201,168,76,0.35)",
                    borderRadius: 999,
                    padding: "12px 26px",
                  }}
                >
                  <RtlLine text={c} style={{ fontSize: 25, color: "#e7eef7", gap: 8 }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {chips.slice(3).map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(13,148,136,0.45)",
                    borderRadius: 999,
                    padding: "12px 26px",
                  }}
                >
                  <RtlLine text={c} style={{ fontSize: 25, color: "#e7eef7", gap: 8 }} />
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 26,
                  color: "rgba(255,255,255,0.55)",
                  padding: "12px 10px",
                }}
              >
                nidhamhr.com
              </div>
            </div>
          </div>

          {/* Right: brand + tagline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <div style={{ fontSize: 78, fontWeight: 700, color: GOLD, lineHeight: 1 }}>
                  نظام
                </div>
                <div
                  style={{
                    fontSize: 20,
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: 8,
                  }}
                >
                  NIDHAM HR
                </div>
              </div>
              <div
                style={{
                  width: 10,
                  height: 96,
                  borderRadius: 5,
                  backgroundColor: GOLD,
                }}
              />
            </div>
            <RtlLine
              text="أول منصة مصرية متكاملة لإدارة الموارد البشرية والمرتبات بالذكاء الاصطناعي"
              style={{
                fontSize: 30,
                color: "#ffffff",
                fontWeight: 700,
                justifyContent: "flex-end",
                maxWidth: 900,
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 2256,
      height: 382,
      fonts: [
        { name: "Tajawal", data: bold, weight: 700, style: "normal" },
        { name: "Tajawal", data: regular, weight: 400, style: "normal" },
      ],
      headers: {
        "cache-control": "public, max-age=3600",
      },
    },
  );
}
