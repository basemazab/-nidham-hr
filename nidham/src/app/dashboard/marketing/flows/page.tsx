// ============================================================================
// /dashboard/marketing/flows — button-menu Flow builder (ManyChat-style)
// ============================================================================
// Build a flow: nodes (message + buttons). A trigger keyword starts the flow;
// tapping a button sends the linked node. Node-editor (not a drag canvas) v1.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/permissions";
import { canUseFeature } from "@/lib/subscriptions-server";
import { UpgradeRequired } from "@/components/upgrade-required";
import {
  createFlow,
  toggleFlow,
  deleteFlow,
  addFlowNode,
  updateFlowNode,
  deleteFlowNode,
} from "./actions";

export const dynamic = "force-dynamic";

type Flow = { id: string; name: string; trigger_keywords: string[] | null; active: boolean };
type FlowButton = { label?: string; next_node_id?: string | null };
type Node = {
  id: string;
  flow_id: string;
  label: string;
  message: string;
  is_start: boolean;
  buttons: FlowButton[] | null;
};

export default async function FlowsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await canUseFeature("marketing_studio"))) {
    return <UpgradeRequired feature="marketing_studio" />;
  }

  const { profile } = await getMyProfile();
  const companyId = profile?.company_id ?? "";
  const sp = await searchParams;

  const { data: flowsData } = await supabase
    .from("marketing_flows")
    .select("id, name, trigger_keywords, active")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<Flow[]>();
  const flows = flowsData ?? [];
  const ids = flows.map((f) => f.id);

  let nodesByFlow: Record<string, Node[]> = {};
  if (ids.length > 0) {
    const { data: nodes } = await supabase
      .from("marketing_flow_nodes")
      .select("id, flow_id, label, message, is_start, buttons")
      .in("flow_id", ids)
      .order("created_at", { ascending: true })
      .returns<Node[]>();
    nodesByFlow = (nodes ?? []).reduce<Record<string, Node[]>>((acc, n) => {
      (acc[n.flow_id] ||= []).push(n);
      return acc;
    }, {});
  }

  return (
    <main className="flex-1 px-4 md:px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-violet-50/20 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/dashboard/marketing" className="text-sm text-slate-500 hover:text-brand-cyan-dark font-cairo">
            ← استوديو التسويق
          </Link>
        </div>

        <header className="mb-6">
          <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 border border-violet-300 text-violet-800 text-xs font-bold mb-2 font-cairo">
            🔀 الفلوهات (Flows)
          </div>
          <h1 className="text-3xl font-black font-cairo text-slate-800 mb-1">
            فلو أزرار تفاعلي
          </h1>
          <p className="text-sm text-slate-500 font-cairo leading-relaxed max-w-2xl">
            كلمة بتبدأ الفلو → رسالة فيها أزرار → كل زر يودّي لعقدة تانية. ابنِ
            العُقَد، بعدين عدّل كل عقدة وحطّ أزرارها (كل زر يوصّل لعقدة).
          </p>
        </header>

        {sp.ok && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-cairo">تم ✓</div>
        )}
        {sp.err && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-cairo">{decodeURIComponent(sp.err)}</div>
        )}

        {/* Create flow */}
        <form action={createFlow} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 mb-6">
          <input name="name" required placeholder="اسم الفلو (مثلاً: منيو الترحيب)" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo" />
          <input name="trigger_keywords" placeholder="كلمات البداية (مثلاً: ابدأ، منيو، مساعدة) — مفصولة بفاصلة" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo" />
          <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold font-cairo text-sm">+ فلو جديد</button>
        </form>

        {flows.length === 0 ? (
          <p className="text-sm text-slate-400 font-cairo">مفيش فلوهات لسه — اعمل أول فلو فوق.</p>
        ) : (
          <div className="space-y-6">
            {flows.map((flow) => {
              const nodes = nodesByFlow[flow.id] ?? [];
              return (
                <section key={flow.id} className="bg-white border-2 border-violet-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="font-black font-cairo text-slate-800">
                      {flow.active ? "🟢" : "⚪"} {flow.name}
                    </h2>
                    <div className="flex items-center gap-3">
                      <form action={toggleFlow}>
                        <input type="hidden" name="id" value={flow.id} />
                        <input type="hidden" name="active" value={flow.active ? "0" : "1"} />
                        <button className="text-xs font-bold text-slate-500 hover:text-slate-800 font-cairo">{flow.active ? "إيقاف" : "تشغيل"}</button>
                      </form>
                      <form action={deleteFlow}>
                        <input type="hidden" name="id" value={flow.id} />
                        <button className="text-xs font-bold text-rose-500 hover:text-rose-700 font-cairo">حذف</button>
                      </form>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(flow.trigger_keywords ?? []).map((k, i) => (
                      <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">{k}</span>
                    ))}
                    {(flow.trigger_keywords ?? []).length === 0 && (
                      <span className="text-[11px] text-amber-600 font-cairo">⚠ مفيش كلمات بداية — الفلو مش هيتفعّل</span>
                    )}
                  </div>

                  {/* Nodes */}
                  <div className="space-y-3">
                    {nodes.map((node) => (
                      <form
                        key={node.id}
                        action={updateFlowNode}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50"
                      >
                        <input type="hidden" name="id" value={node.id} />
                        <input type="hidden" name="flow_id" value={flow.id} />
                        <div className="flex items-center gap-2 mb-2">
                          <input name="label" defaultValue={node.label} placeholder="اسم العقدة" className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs font-cairo font-bold" />
                          <label className="text-[11px] font-cairo text-slate-600 flex items-center gap-1">
                            <input type="checkbox" name="is_start" defaultChecked={node.is_start} /> البداية
                          </label>
                        </div>
                        <textarea name="message" defaultValue={node.message} rows={2} className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm font-cairo mb-2" />
                        <div className="space-y-1 mb-2">
                          {[0, 1, 2].map((i) => {
                            const b = (node.buttons ?? [])[i];
                            return (
                              <div key={i} className="flex items-center gap-1.5">
                                <input
                                  name={`btn_label_${i + 1}`}
                                  defaultValue={b?.label ?? ""}
                                  placeholder={`زر ${i + 1}`}
                                  className="w-28 px-2 py-1 rounded border border-slate-200 text-xs font-cairo"
                                />
                                <span className="text-slate-400 text-xs">→</span>
                                <select
                                  name={`btn_next_${i + 1}`}
                                  defaultValue={b?.next_node_id ?? ""}
                                  className="flex-1 px-2 py-1 rounded border border-slate-200 text-xs font-cairo"
                                >
                                  <option value="">— يوصّل لعقدة —</option>
                                  {nodes
                                    .filter((n) => n.id !== node.id)
                                    .map((n) => (
                                      <option key={n.id} value={n.id}>
                                        {n.label}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-3">
                          <button type="submit" className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold font-cairo text-xs">احفظ العقدة</button>
                          <span className="text-[10px] text-slate-400 font-cairo">{node.is_start ? "🚀 عقدة البداية" : ""}</span>
                        </div>
                        <button
                          formAction={deleteFlowNode}
                          className="mt-1 text-[11px] text-rose-400 hover:text-rose-600 font-cairo"
                        >
                          حذف العقدة
                        </button>
                      </form>
                    ))}
                    {nodes.length === 0 && (
                      <p className="text-xs text-slate-400 font-cairo">مفيش عُقَد — ضيف أول عقدة (هتبقى البداية).</p>
                    )}
                  </div>

                  {/* Add node */}
                  <form action={addFlowNode} className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="flow_id" value={flow.id} />
                    <input name="label" placeholder="اسم العقدة" className="w-32 px-2 py-1.5 rounded border border-slate-200 text-sm font-cairo" />
                    <input name="message" required placeholder="نص الرسالة..." className="flex-1 min-w-[160px] px-3 py-2 rounded-lg border border-slate-200 text-sm font-cairo" />
                    <button type="submit" className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-bold font-cairo text-sm">+ عقدة</button>
                  </form>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 font-cairo leading-relaxed">
          💡 طريقة البناء: (1) اعمل فلو بكلمات بداية. (2) ضيف العُقَد (رسائلها). (3) عدّل كل عقدة
          وحطّ أزرارها — كل زر تختارله العقدة اللي يوصّلها. (4) علّم عقدة «البداية». الأزرار بتظهر
          للعميل كاختيارات يدوس عليها. (يشتغل جوه نافذة 24 ساعة لـ Meta.)
        </div>
      </div>
    </main>
  );
}
