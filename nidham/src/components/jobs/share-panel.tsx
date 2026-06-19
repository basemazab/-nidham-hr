"use client";

import { useState } from "react";
import { Copy, ExternalLink, Eye, Sparkles, Check, Loader2, Share2, MessageCircle, Globe } from "lucide-react";

type Props = {
  jobId: string;
  jobTitle: string;
  department?: string;
  location?: string;
  jobType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string;
  requirements?: string;
  publicUrl: string | null;
};

type Variants = {
  facebook: { caption: string; hashtags: string };
  linkedin: { caption: string; hashtags: string };
  whatsapp: { caption: string; hashtags: string };
};

// Robust copy: the async Clipboard API needs a secure context AND a focused
// document, so it silently fails in some browsers/embeds. Fall back to a
// hidden textarea + execCommand, and report whether the copy actually
// succeeded so the UI can offer a manual copy as a last resort.
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path below */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.setAttribute("readonly", "");
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function SharePanel({ jobTitle, department, location, jobType, salaryMin, salaryMax, description, requirements, publicUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [variants, setVariants] = useState<Variants | null>(null);
  const [copyVariant, setCopyVariant] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const url = publicUrl ?? "";

  const copyLink = async () => {
    if (!url) {
      setHint("لازم تنشر الوظيفة الأول (خليها «عامة» وحالتها «مفتوحة») عشان يبقى ليها رابط تقديم تنسخه.");
      setTimeout(() => setHint(null), 6000);
      return;
    }
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setHint("المتصفح منع النسخ التلقائي — انسخ الرابط يدويًا:\n" + url);
      setTimeout(() => setHint(null), 9000);
    }
  };

  const shareFacebook = () => {
    if (!url) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,width=600,height=400");
  };

  const shareLinkedin = () => {
    if (!url) return;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener,width=600,height=400");
  };

  const generatePost = async () => {
    setGenerating(true);
    setVariants(null);
    try {
      const res = await fetch("/api/jobs/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: jobTitle, department, location, job_type: jobType, salary_min: salaryMin, salary_max: salaryMax, description, requirements }),
      });
      const data = await res.json();
      if (data.ok && data.variants) {
        setVariants(data.variants);
      }
    } catch { /* ignore */ }
    setGenerating(false);
  };

  const copyVariantText = async (key: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopyVariant(key);
      setTimeout(() => setCopyVariant(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
      <h3 className="text-sm font-bold text-slate-800 font-cairo">مشاركة الوظيفة</h3>

      <div className="flex flex-wrap gap-2">
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-brand-cyan to-brand-cyan-dark text-white text-xs font-bold font-cairo hover:shadow-lg transition"
          >
            <Eye size={14} /> معاينة الصفحة العامة
          </a>
        )}

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold font-cairo hover:bg-slate-50 transition"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copied ? "تم النسخ" : "نسخ رابط التقديم"}
        </button>

        <button
          type="button"
          onClick={shareFacebook}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold font-cairo hover:bg-blue-100 transition border border-blue-200"
        >
          <Globe size={14} /> شارك على Facebook
        </button>

        <button
          type="button"
          onClick={shareLinkedin}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold font-cairo hover:bg-sky-100 transition border border-sky-200"
        >
          <Share2 size={14} /> شارك على LinkedIn
        </button>

        <button
          type="button"
          onClick={generatePost}
          disabled={generating}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold font-cairo hover:bg-purple-100 transition border border-purple-200 disabled:opacity-50"
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? "جاري التوليد..." : "توليد منشور سوشيال ميديا"}
        </button>
      </div>

      {hint && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-cairo whitespace-pre-line break-all">
          {hint}
        </p>
      )}

      {variants && (
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-cairo">3 نصوص جاهزة للنسخ:</p>
          {(["facebook", "linkedin", "whatsapp"] as const).map((key) => {
            const v = variants[key];
            const fullText = `${v.caption}\n\n${v.hashtags}`;
            return (
              <div key={key} className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 font-cairo">
                    {key === "facebook" ? "📘 Facebook" : key === "linkedin" ? "💼 LinkedIn" : "💬 WhatsApp"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyVariantText(key, fullText)}
                    className="text-xs text-brand-cyan-dark hover:underline font-cairo flex items-center gap-1"
                  >
                    {copyVariant === key ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    {copyVariant === key ? "تم" : "نسخ"}
                  </button>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-cairo">{v.caption}</p>
                <p className="text-[10px] text-brand-cyan-dark mt-1 font-cairo">{v.hashtags}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
