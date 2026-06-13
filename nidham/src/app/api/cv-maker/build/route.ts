// /api/cv-maker/build — PUBLIC: turn raw text into an ATS CV + score.
// No auth (growth tool). IP rate-limited to deter abuse.

import { checkRateLimit } from "@/lib/rate-limit";
import {
  structureAndEnhanceCV,
  reviewCvAts,
} from "@/lib/cv-builder";

export const maxDuration = 60;

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] || req.headers.get("x-real-ip") || "anon").trim();
}

export async function POST(req: Request) {
  const rl = checkRateLimit(`cv-maker:${clientIp(req)}`, 8, 10 * 60_000);
  if (!rl.ok) {
    return Response.json(
      { error: `استنى شوية — جرّب تاني بعد ${Math.ceil(rl.retryAfterSeconds / 60)} دقيقة` },
      { status: 429 },
    );
  }

  let body: { rawText?: string; targetRole?: string };
  try {
    body = (await req.json()) as { rawText?: string; targetRole?: string };
  } catch {
    return Response.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const rawText = (body.rawText ?? "").trim();
  if (rawText.length < 30) {
    return Response.json({ error: "اكتب بياناتك أو الصق سيرتك (30 حرف على الأقل)" }, { status: 400 });
  }

  try {
    const cv = await structureAndEnhanceCV({
      rawText: rawText.slice(0, 16000),
      targetRole: body.targetRole?.trim() || undefined,
    });
    let review = null;
    try {
      review = await reviewCvAts({ cv, targetRole: body.targetRole?.trim() || undefined });
    } catch {
      review = null; // score is a bonus — never block the build
    }
    return Response.json({ ok: true, cv, review });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error:
          "الخدمة عليها ضغط دلوقتي — جرّب تاني بعد دقيقة. (لو اتكرر، الصق نص أقصر)",
        detail: err instanceof Error ? err.message.slice(0, 120) : "",
      },
      { status: 502 },
    );
  }
}
