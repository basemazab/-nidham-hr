import { ImageResponse } from "@vercel/og";

export const runtime = "edge";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "تقديم على وظيفة";

    return new ImageResponse(
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "row",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 720,
            height: 630,
            background: "#0a0f1a",
            padding: "60px 48px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 6,
                  height: 32,
                  background: "#c9a84c",
                  borderRadius: 3,
                }}
              />
              <span style={{ fontSize: 26, fontWeight: 900, color: "#c9a84c" }}>
                نِظام HR
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{ width: 60, height: 4, background: "#c9a84c", borderRadius: 2 }}
            />
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.2,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {title.length > 40 ? title.slice(0, 40) + "..." : title}
            </div>
            <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)" }}>
              قدم على الوظيفة الآن — خطوة واحدة نحو مستقبلك المهني
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>
              nidhamhr.com
            </span>
            <span style={{ fontSize: 14, color: "rgba(201,168,76,0.6)" }}>
              نظام متكامل لإدارة الموارد البشرية
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 480,
            height: 630,
            background: "linear-gradient(180deg, #0d9488 0%, #0f766e 100%)",
            padding: "60px 40px",
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              padding: "8px 20px",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: "#ffffff" }}>
              AI-Powered
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "16px 20px",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "#c9a84c",
                }}
              />
              <span style={{ fontSize: 18, color: "#ffffff", fontWeight: 600 }}>
                تقييم ذكي للسيرة الذاتية
              </span>
            </div>
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "16px 20px",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "#c9a84c",
                }}
              />
              <span style={{ fontSize: 18, color: "#ffffff", fontWeight: 600 }}>
                تصفية تلقائية للمتقدمين
              </span>
            </div>
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "16px 20px",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "#c9a84c",
                }}
              />
              <span style={{ fontSize: 18, color: "#ffffff", fontWeight: 600 }}>
                تتبع المتقدمين في الوقت الحقيقي
              </span>
            </div>
          </div>
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  } catch (e) {
    return new Response(
      `OG Error: ${e instanceof Error ? e.message : String(e)}`,
      { status: 500, headers: { "content-type": "text/plain" } },
    );
  }
}
