// ============================================================================
// /api/og/linkedin-post — branded LinkedIn feed image generator (1200×627)
// ============================================================================
// Parameterized so marketing can mint unlimited on-brand visuals:
//   ?title=...        big headline (Arabic OK — word-level RTL layout)
//   &sub=...          optional subtitle line
//   &badge=...        optional top badge text (default: فرصة تعرف نظام)
// Same Tajawal fonts + RTL trick as the other generators.

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
  const title = (searchParams.get("title") || "نظام — Nidham HR").slice(0, 80);
  const sub = (searchParams.get("sub") || "").slice(0, 120);
  const badge = (searchParams.get("badge") || "").slice(0, 40);

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
            "radial-gradient(circle at 85% 15%, rgba(201,168,76,0.2) 0%, rgba(201,168,76,0) 45%), radial-gradient(circle at 10% 90%, rgba(13,148,136,0.28) 0%, rgba(13,148,136,0) 50%)",
          fontFamily: "Tajawal",
          padding: "44px 64px",
        }}
      >
        {/* Top: brand + optional badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 8,
                height: 40,
                borderRadius: 4,
                backgroundColor: GOLD,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: GOLD }}>
                نظام
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: 4,
                }}
              >
                NIDHAM HR
              </div>
            </div>
          </div>
          {badge ? (
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
              <RtlLine text={badge} gap={8} style={{ fontSize: 21, fontWeight: 700 }} />
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>

        {/* Center: title + subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            maxWidth: 1040,
          }}
        >
          <RtlLine
            text={title}
            gap={18}
            style={{
              fontSize: title.length > 35 ? 56 : 66,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.25,
            }}
          />
          {sub && (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{ width: 46, height: 4, borderRadius: 2, backgroundColor: GOLD }}
              />
              <RtlLine
                text={sub}
                gap={8}
                style={{ fontSize: 27, color: "rgba(255,255,255,0.78)", maxWidth: 860 }}
              />
              <div
                style={{ width: 46, height: 4, borderRadius: 2, backgroundColor: GOLD }}
              />
            </div>
          )}
        </div>

        {/* Bottom: CTA */}
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
              borderRadius: 14,
              padding: "14px 36px",
              boxShadow: "0 8px 30px rgba(201,168,76,0.35)",
            }}
          >
            <RtlLine
              text="جرّبه مجانًا 14 يوم"
              gap={9}
              style={{ fontSize: 26, fontWeight: 700 }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            nidhamhr.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 627,
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
