import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 2560,
          height: 1440,
          display: "flex",
          flexDirection: "row",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* LEFT: Dark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 1400,
            height: 1440,
            background: "#0a0f1a",
            padding: "180px 140px",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 100,
              height: 100,
              borderRadius: 24,
              background: "linear-gradient(135deg, #0d9488, #0a0f1a)",
              border: "2px solid #c9a84c",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 56, fontWeight: 900, color: "#c9a84c" }}>ن</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <span
              style={{
                fontSize: 96,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.1,
                display: "flex",
              }}
            >
              نِظام HR
            </span>
            <div style={{ width: 120, height: 6, background: "#c9a84c", borderRadius: 3 }} />
            <span style={{ fontSize: 40, color: "rgba(255,255,255,0.7)", display: "flex" }}>
              نظام متكامل لإدارة الموارد البشرية
            </span>
            <span
              style={{
                fontSize: 32,
                color: "rgba(201,168,76,0.8)",
                display: "flex",
              }}
            >
              مصمم خصيصاً للسوق المصري — متوافق مع قانون العمل والتأمينات
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 28, color: "rgba(255,255,255,0.4)" }}>
            <span>nidhamhr.com</span>
            <span style={{ color: "#c9a84c" }}>✦</span>
            <span>HR • Payroll • AI • CRM</span>
          </div>
        </div>

        {/* RIGHT: Teal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 1160,
            height: 1440,
            background: "linear-gradient(180deg, #0d9488 0%, #0f766e 100%)",
            padding: "200px 100px",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 16,
              padding: "12px 28px",
              alignSelf: "flex-start",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, color: "#ffffff" }}>
              ✦ AI-Powered
            </span>
          </div>

          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, color: "#c9a84c" }}>▸</span>
            <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 600 }}>إدارة الموظفين بالكامل</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, color: "#c9a84c" }}>▸</span>
            <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 600 }}>حساب المرتبات والتأمينات</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, color: "#c9a84c" }}>▸</span>
            <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 600 }}>حضور GPS + سيلفي + Geofencing</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, color: "#c9a84c" }}>▸</span>
            <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 600 }}>ربط أجهزة ZKTeco / Hikvision</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, color: "#c9a84c" }}>▸</span>
            <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 600 }}>المساعد الذكي AI</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, color: "#c9a84c" }}>▸</span>
            <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 600 }}>بوت واتساب للموظفين</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, color: "#c9a84c" }}>▸</span>
            <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 600 }}>التوقيع الإلكتروني</span>
          </div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 24px", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 24, color: "#c9a84c" }}>▸</span>
            <span style={{ fontSize: 28, color: "#ffffff", fontWeight: 600 }}>إدارة العملاء CRM</span>
          </div>
        </div>
      </div>
    ),
    { width: 2560, height: 1440 },
  );
}
