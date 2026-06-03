"use client";

import { useState } from "react";

// Copy-to-clipboard button for the referral link, with WhatsApp share —
// WhatsApp is the dominant sharing channel in Egypt, so a one-tap share
// matters more than a generic copy.
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Older browsers — select-and-copy fallback
      const tmp = document.createElement("input");
      tmp.value = url;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const waText = encodeURIComponent(
    `جرّب نِظام HR — نظام موارد بشرية ومرتبات مصري. سجّل من اللينك ده وكلانا ياخد شهر مجاني:\n${url}`,
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-700 dark:text-slate-200 outline-none"
        />
        <button
          type="button"
          onClick={copy}
          className={`px-5 py-3 rounded-lg font-bold font-cairo text-sm transition whitespace-nowrap ${
            copied
              ? "bg-emerald-500 text-white"
              : "bg-brand-cyan-dark text-white hover:bg-brand-cyan"
          }`}
        >
          {copied ? "✓ اتنسخ" : "نسخ اللينك"}
        </button>
      </div>
      <a
        href={`https://wa.me/?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#25D366] hover:bg-[#1da851] text-white font-bold font-cairo text-sm transition"
      >
        <span>📲</span> شارك على واتساب
      </a>
    </div>
  );
}
