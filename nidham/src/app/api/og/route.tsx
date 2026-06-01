export const runtime = "edge";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function box(x: number, y: number, text: string): string {
  const escaped = esc(text);
  return `<rect x="${x}" y="${y}" width="344" height="56" rx="8" fill="rgba(255,255,255,0.1)"/><text x="${x + 44}" y="${y + 36}" font-family="system-ui, sans-serif" font-size="18" fill="#fff" font-weight="600">${escaped}</text><circle cx="${x + 20}" cy="${y + 28}" r="4" fill="#c9a84c"/>`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "تقديم على وظيفة";
  const display = title.length > 40 ? title.slice(0, 40) + "..." : title;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0d9488"/><stop offset="100%" stop-color="#0f766e"/></linearGradient></defs>
<rect x="0" y="0" width="720" height="630" fill="#0a0f1a"/>
<rect x="720" y="0" width="480" height="630" fill="url(#g)"/>
<rect x="48" y="96" width="6" height="32" rx="3" fill="#c9a84c"/>
<text x="68" y="118" font-family="system-ui, sans-serif" font-size="26" font-weight="900" fill="#c9a84c">نِظام HR</text>
<rect x="48" y="380" width="60" height="4" rx="2" fill="#c9a84c"/>
<text x="48" y="456" font-family="system-ui, sans-serif" font-size="56" font-weight="900" fill="#fff">${esc(display)}</text>
<text x="48" y="508" font-family="system-ui, sans-serif" font-size="20" fill="rgba(255,255,255,0.6)">قدم على الوظيفة الآن — خطوة واحدة نحو مستقبلك المهني</text>
<text x="48" y="578" font-family="system-ui, sans-serif" font-size="16" fill="rgba(255,255,255,0.4)">nidhamhr.com</text>
<text x="210" y="578" font-family="system-ui, sans-serif" font-size="14" fill="rgba(201,168,76,0.6)">نظام متكامل لإدارة الموارد البشرية</text>
<rect x="788" y="100" width="344" height="44" rx="12" fill="rgba(255,255,255,0.15)"/>
<text x="960" y="128" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">AI-Powered</text>
${box(788, 170, "تقييم ذكي للسيرة الذاتية")}
${box(788, 240, "تصفية تلقائية للمتقدمين")}
${box(788, 310, "تتبع المتقدمين في الوقت الحقيقي")}
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
