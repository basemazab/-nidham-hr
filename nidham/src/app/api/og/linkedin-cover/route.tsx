// ============================================================================
// /api/og/linkedin-cover — LinkedIn company-page banner for نِظام (PNG)
// ============================================================================
// LinkedIn REJECTS oversized covers at the final save step ("لقد فشل تحديث
// صورة الغلاف"), so the DEFAULT render is the exact official 1128×191.
// ?scale=2 returns a 2256×382 version for other uses. Same Tajawal fonts +
// word-level RTL trick as the job OG image (Satori can't do bidi paragraphs).

import { ImageResponse } from "next/og";

export const runtime = "edge";

const GOLD = "#C9A84C";
const NAVY = "#0D1B2A";

function RtlLine({
  text,
  gap,
  style = {},
}: {
  text: string;
  gap: number;
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
        gap,
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

export async function GET(req: Request) {
  const [bold, regular] = await fontsPromise;

  const { searchParams } = new URL(req.url);
  const s = searchParams.get("scale") === "2" ? 2 : 1;

  const chips = [
    "🤖 مساعد HR ذكي",
    "💰 مرتبات بالقانون المصري",
    "🎯 توظيف ذكي",
    "⏰ حضور GPS وبصمة",
    "💼 CRM ومبيعات",
  ];

  const chipStyle = (accent: "gold" | "teal") => ({
    display: "flex",
    backgroundColor: "rgba(255,255,255,0.08)",
    border:
      accent === "gold"
        ? "1px solid rgba(201,168,76,0.35)"
        : "1px solid rgba(13,148,136,0.45)",
    borderRadius: 999,
    padding: `${6 * s}px ${13 * s}px`,
  });

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
          padding: `0 ${45 * s}px`,
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
              gap: 11 * s,
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", gap: 8 * s }}>
              {chips.slice(0, 3).map((c, i) => (
                <div key={i} style={chipStyle("gold")}>
                  <RtlLine
                    text={c}
                    gap={4 * s}
                    style={{ fontSize: 13 * s, color: "#e7eef7" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 * s }}>
              {chips.slice(3).map((c, i) => (
                <div key={i} style={chipStyle("teal")}>
                  <RtlLine
                    text={c}
                    gap={4 * s}
                    style={{ fontSize: 13 * s, color: "#e7eef7" }}
                  />
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13 * s,
                  color: "rgba(255,255,255,0.55)",
                  padding: `${6 * s}px ${5 * s}px`,
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
              gap: 7 * s,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 * s }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    fontSize: 39 * s,
                    fontWeight: 700,
                    color: GOLD,
                    lineHeight: 1,
                  }}
                >
                  نظام
                </div>
                <div
                  style={{
                    fontSize: 10 * s,
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: 4 * s,
                  }}
                >
                  NIDHAM HR
                </div>
              </div>
              <div
                style={{
                  width: 5 * s,
                  height: 48 * s,
                  borderRadius: 3 * s,
                  backgroundColor: GOLD,
                }}
              />
            </div>
            <RtlLine
              text="أول منصة مصرية متكاملة لإدارة الموارد البشرية والمرتبات بالذكاء الاصطناعي"
              gap={5 * s}
              style={{
                fontSize: 15 * s,
                color: "#ffffff",
                fontWeight: 700,
                justifyContent: "flex-end",
                maxWidth: 460 * s,
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1128 * s,
      height: 191 * s,
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
