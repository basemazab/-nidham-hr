import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 800,
          height: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0f1a 0%, #0d1518 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            width: 640,
            height: 640,
            borderRadius: 320,
            border: "4px solid #c9a84c",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(180deg, #0d9488 0%, #0a0f1a 80%)",
          }}
        >
          {/* Inner circle */}
          <div
            style={{
              width: 480,
              height: 480,
              borderRadius: 240,
              background: "#0a0f1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(201,168,76,0.3)",
            }}
          >
            {/* "ن" letter in gold */}
            <span
              style={{
                fontSize: 300,
                fontWeight: 900,
                color: "#c9a84c",
                lineHeight: 1,
              }}
            >
              ن
            </span>
          </div>
        </div>
        {/* Small accent dot */}
        <div
          style={{
            position: "absolute",
            bottom: 140,
            right: 140,
            width: 24,
            height: 24,
            borderRadius: 12,
            background: "#c9a84c",
          }}
        />
      </div>
    ),
    { width: 800, height: 800 },
  );
}
