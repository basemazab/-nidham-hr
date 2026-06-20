"use client";

import { useState } from "react";
import { saveLogo, removeLogo } from "./actions";

const NAVY = "#0D1B2A";
const GOLD = "#C9A84C";

// Downscale any uploaded image to a small PNG data URL (keeps transparency for
// logos, embeds with zero network dependency, keeps the DB column tiny).
function resizeToDataUrl(file: File, maxDim = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (!w || !h) {
          reject(new Error("empty image"));
          return;
        }
        if (w > maxDim || h > maxDim) {
          const scale = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("no canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function BrandingClient({
  companyName,
  initialLogo,
}: {
  companyName: string;
  initialLogo: string | null;
}) {
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg({ tone: "err", text: "الملف لازم يكون صورة (PNG / JPG / SVG)" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg({ tone: "err", text: "الصورة أكبر من 5 ميجا — اختار صورة أصغر" });
      return;
    }
    setMsg(null);
    try {
      const dataUrl = await resizeToDataUrl(file);
      setLogo(dataUrl);
      setDirty(true);
    } catch {
      setMsg({ tone: "err", text: "تعذّر قراءة الصورة — جرّب صورة تانية" });
    }
  };

  const save = async () => {
    if (!logo) return;
    setBusy(true);
    setMsg(null);
    const res = await saveLogo(logo);
    setBusy(false);
    if (res.ok) {
      setDirty(false);
      setMsg({ tone: "ok", text: "✓ تم حفظ الشعار — هيظهر في كل المستندات الجديدة." });
    } else {
      setMsg({ tone: "err", text: res.error ?? "حصل خطأ، جرّب تاني" });
    }
  };

  const remove = async () => {
    setBusy(true);
    setMsg(null);
    const res = await removeLogo();
    setBusy(false);
    if (res.ok) {
      setLogo(null);
      setDirty(false);
      setMsg({ tone: "ok", text: "تم حذف الشعار." });
    } else {
      setMsg({ tone: "err", text: res.error ?? "حصل خطأ، جرّب تاني" });
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-5">
      {/* ── Uploader ── */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
        <h2 className="font-black text-slate-800 font-cairo mb-3">شعار الشركة</h2>

        <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 flex flex-col items-center justify-center text-center min-h-[140px]">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="شعار الشركة" className="max-h-24 max-w-[200px] object-contain" />
          ) : (
            <span className="text-sm text-slate-400 font-cairo">لسه مفيش شعار مرفوع</span>
          )}
        </div>

        <label className="mt-4 block">
          <span className="block text-xs font-bold text-slate-500 mb-1 font-cairo">
            اختار صورة الشعار (PNG / JPG / SVG)
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => onPick(e.target.files?.[0])}
            className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-cyan file:text-white file:font-bold file:cursor-pointer file:font-cairo"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={save}
            disabled={busy || !logo || !dirty}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white font-bold font-cairo text-sm shadow-md hover:shadow-lg transition disabled:opacity-50"
          >
            {busy ? "⏳ بيحفظ..." : "حفظ الشعار"}
          </button>
          {logo && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold font-cairo text-sm hover:bg-red-50 transition disabled:opacity-50"
            >
              🗑 حذف الشعار
            </button>
          )}
        </div>

        {msg && (
          <p
            className={`mt-3 text-xs rounded-lg px-3 py-2 font-cairo ${
              msg.tone === "ok"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {msg.text}
          </p>
        )}

        <p className="mt-3 text-[11px] text-slate-400 font-cairo leading-relaxed">
          بنصغّر الصورة تلقائيًا للحجم الأمثل. الأفضل شعار بخلفية شفافة (PNG).
        </p>
      </div>

      {/* ── Live letterhead preview ── */}
      <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4">
        <div className="text-xs font-bold text-slate-500 mb-2 font-cairo">معاينة الترويسة على المستندات</div>
        <div className="bg-white rounded-lg shadow-sm p-5 font-cairo" dir="rtl">
          <div className="flex items-end justify-between border-b-[3px] border-double pb-2" style={{ borderColor: NAVY }}>
            <div className="flex items-center gap-3">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="h-11 max-w-[140px] object-contain" />
              )}
              <div>
                <div className="text-lg font-black" style={{ color: NAVY }}>{companyName}</div>
                <div className="h-[3px] w-14 mt-1" style={{ background: GOLD }} />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 border border-slate-200 rounded px-2 py-0.5">
              مستند رسمي
            </span>
          </div>
          <div className="text-center text-base font-black mt-5 mb-1" style={{ color: NAVY }}>
            مذكرة داخلية
          </div>
          <div className="h-0.5 w-20 mx-auto mb-3" style={{ background: GOLD }} />
          <div className="space-y-1.5">
            <div className="h-2 bg-slate-100 rounded w-full" />
            <div className="h-2 bg-slate-100 rounded w-5/6" />
            <div className="h-2 bg-slate-100 rounded w-4/6" />
          </div>
          <div className="mt-6 border-t border-slate-100 pt-2 text-center text-[10px] text-slate-400">
            {companyName} — صدر عبر نِظام
          </div>
        </div>
      </div>
    </div>
  );
}
