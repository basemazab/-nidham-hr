import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

function fixMojibake(text: string): string {
  if (!text || typeof text !== "string") return text;
  const bytes: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const cp = text.charCodeAt(i);
    if (cp >= 0x00 && cp <= 0x7f) { bytes.push(cp); continue; }
    if (cp >= 0xc0 && cp <= 0xff) { bytes.push(cp - 0xc0); continue; }
    if (cp >= 0xa0 && cp <= 0xbf) { bytes.push(cp - 0xa0); continue; }
    const win1252: Record<number, number> = {
      0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
      0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
      0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
      0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
      0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
      0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
      0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
    };
    if (win1252[cp] !== undefined) { bytes.push(win1252[cp]); continue; }
    bytes.push(0x3f);
  }
  return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

export async function POST(req: Request) {
  const auth = req.headers.get("x-admin-token");
  if (auth !== "fix-workflows-2026") return Response.json({ error: "Unauthorized" }, { status: 401 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return Response.json({ error: "No service key" }, { status: 500 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: workflows, error } = await supabase
    .from("workflows")
    .select("id, name, description, actions");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!workflows?.length) return Response.json({ message: "لا توجد سير عمل", count: 0 });

  let fixed = 0;
  for (const wf of workflows) {
    const fixedName = fixMojibake(wf.name);
    const fixedDesc = wf.description ? fixMojibake(wf.description) : null;
    let fixedActions = wf.actions;
    try {
      const actions = typeof wf.actions === "string" ? JSON.parse(wf.actions) : wf.actions;
      if (Array.isArray(actions)) {
        const newActions = actions.map((a: Record<string, unknown>) => {
          if (a.config && typeof a.config === "object") {
            const c = a.config as Record<string, unknown>;
            if (typeof c.title === "string") c.title = fixMojibake(c.title);
            if (typeof c.body === "string") c.body = fixMojibake(c.body);
          }
          return a;
        });
        fixedActions = newActions;
      }
    } catch {}

    await supabase
      .from("workflows")
      .update({ name: fixedName, description: fixedDesc, actions: fixedActions as never })
      .eq("id", wf.id);

    fixed++;
  }

  return Response.json({ message: `تم إصلاح ${fixed} سير عمل` });
}
