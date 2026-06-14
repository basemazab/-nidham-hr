"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createApiKey, revokeApiKey, deleteApiKey } from "./actions";
import { API_SCOPES } from "@/lib/api/keys";
import {
  Copy,
  Trash2,
  Plus,
  Check,
  Key,
  BookOpen,
  Terminal,
  AlertTriangle,
  ShieldCheck,
  Clock,
} from "lucide-react";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  rate_limit_rps: number;
  created_at: string;
}

const API_BASE = "https://www.nidhamhr.com/api/v1";

// write scopes are sensitive → amber; read scopes → cyan
function scopeChipClass(scope: string): string {
  return scope.endsWith(":write")
    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
    : "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800";
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ApiKeysClient({ keys }: { keys: ApiKeyRow[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState<"production" | "test">("production");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["employees:read"]);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function copy(text: string, tag: string) {
    navigator.clipboard.writeText(text);
    setCopied(tag);
    setTimeout(() => setCopied((c) => (c === tag ? null : c)), 1800);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (selectedScopes.length === 0) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("name", newKeyName);
      formData.set("env", newKeyEnv);
      selectedScopes.forEach((s) => formData.append("scopes", s));
      const result = await createApiKey(formData);
      setCreatedKey(result.raw);
      setShowCreate(false);
      setNewKeyName("");
      setSelectedScopes(["employees:read"]);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  // ── Just-created key: show once ──────────────────────────────────────────
  if (createdKey) {
    const curl = `curl -H "Authorization: Bearer ${createdKey}" \\\n  "${API_BASE}/employees?limit=5"`;
    return (
      <div dir="rtl" className="mx-auto max-w-3xl space-y-5 font-cairo">
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-900/20">
          <div className="mb-2 flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
            تم إنشاء المفتاح بنجاح
          </div>
          <p className="mb-4 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            ده المكان الوحيد اللي هتشوف فيه المفتاح كامل — انسخه واحفظه في مكان آمن دلوقتي.
          </p>
          <div className="flex items-center gap-2 rounded-xl bg-white p-3 dark:bg-slate-900">
            <code dir="ltr" className="flex-1 break-all font-mono text-sm text-slate-800 dark:text-slate-200">
              {createdKey}
            </code>
            <button
              onClick={() => copy(createdKey, "key")}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              {copied === "key" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "key" ? "تم النسخ" : "نسخ"}
            </button>
          </div>
        </div>

        {/* Ready-to-run example */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Terminal className="h-4 w-4" />
            جرّبه فورًا
          </div>
          <div className="relative">
            <pre dir="ltr" className="overflow-x-auto rounded-xl bg-slate-900 p-4 pl-12 text-xs leading-relaxed text-slate-100">
              <code>{curl}</code>
            </pre>
            <button
              onClick={() => copy(curl, "curl")}
              className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white hover:bg-white/20"
            >
              {copied === "curl" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            التوثيق الكامل لكل الـ endpoints في{" "}
            <Link href="/api-docs" className="font-bold text-cyan-600 hover:underline">/api-docs</Link>
          </p>
        </div>

        <button
          onClick={() => setCreatedKey(null)}
          className="text-sm font-bold text-cyan-600 hover:underline"
        >
          → العودة لمفاتيح API
        </button>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-6 font-cairo">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">مفاتيح API</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              اربط نِظام بتطبيقاتك أو بـ ERP زي Odoo عبر REST API موثّق.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/api-docs"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600 hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300"
          >
            <BookOpen className="h-4 w-4" />
            التوثيق
          </Link>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4" />
              مفتاح جديد
            </button>
          )}
        </div>
      </div>

      {/* Base URL strip */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-800/40">
        <span className="font-bold text-slate-500 dark:text-slate-400">Base URL</span>
        <code dir="ltr" className="flex items-center gap-2 font-mono text-slate-700 dark:text-slate-200">
          {API_BASE}
          <button
            onClick={() => copy(API_BASE, "base")}
            className="text-slate-400 hover:text-cyan-600"
            aria-label="نسخ"
          >
            {copied === "base" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </code>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500 dark:text-slate-400">
          المصادقة: <code dir="ltr" className="font-mono text-slate-700 dark:text-slate-200">Authorization: Bearer &lt;key&gt;</code>
        </span>
      </div>

      {/* Create form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
              اسم المفتاح
            </label>
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="مثال: مفتاح Odoo - إنتاج"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800"
              required
            />
          </div>

          {/* Environment as two cards */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-300">
              البيئة
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { v: "production", t: "إنتاج", r: "30 req/s" },
                { v: "test", t: "اختبار", r: "10 req/s" },
              ] as const).map((env) => (
                <button
                  key={env.v}
                  type="button"
                  onClick={() => setNewKeyEnv(env.v)}
                  className={`rounded-xl border-2 p-3 text-right transition ${
                    newKeyEnv === env.v
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200">{env.t}</div>
                  <div className="text-xs text-slate-400" dir="ltr">{env.r}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scopes */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الصلاحيات</label>
              <span className="text-xs text-slate-400">{selectedScopes.length} مختارة</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {API_SCOPES.map((scope) => {
                const active = selectedScopes.includes(scope.value);
                const isWrite = scope.value.endsWith(":write");
                return (
                  <button
                    key={scope.value}
                    type="button"
                    onClick={() => toggleScope(scope.value)}
                    className={`flex items-start gap-3 rounded-xl border-2 p-3 text-right transition ${
                      active
                        ? isWrite
                          ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                          : "border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                        : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                        active
                          ? isWrite
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-cyan-500 bg-cyan-500 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        {scope.label}
                        {isWrite && (
                          <span className="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            كتابة
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-slate-400">{scope.description}</span>
                      <code dir="ltr" className="text-[10px] text-slate-400">{scope.value}</code>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || selectedScopes.length === 0}
              className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {submitting ? "جاري الإنشاء…" : "إنشاء المفتاح"}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {keys.length === 0 && !showCreate && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <Key className="mx-auto mb-4 h-8 w-8 text-slate-300" />
          <p className="mb-1 font-bold text-slate-600 dark:text-slate-300">لسه مفيش مفاتيح API</p>
          <p className="mb-4 text-sm text-slate-400">اعمل مفتاح عشان تربط نِظام بأنظمتك الخارجية.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            مفتاح جديد
          </button>
        </div>
      )}

      {/* Keys list */}
      {keys.length > 0 && (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-900 ${
                key.is_active
                  ? "border-slate-200 dark:border-slate-800"
                  : "border-slate-200 opacity-60 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-white">{key.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        key.is_active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                      }`}
                    >
                      {key.is_active ? "● نشط" : "ملغي"}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <code dir="ltr" className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-500 dark:bg-slate-800">
                      {key.key_prefix}…
                    </code>
                    <span className="flex items-center gap-1" dir="ltr">
                      {key.rate_limit_rps} req/s
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {key.scopes.map((s) => (
                      <span
                        key={s}
                        dir="ltr"
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${scopeChipClass(s)}`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    أُنشئ {fmtDate(key.created_at)}
                    {key.last_used_at
                      ? ` · آخر استخدام ${fmtDate(key.last_used_at)}`
                      : " · لم يُستخدم بعد"}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {key.is_active && (
                    <button
                      onClick={async () => {
                        await revokeApiKey(key.id);
                        router.refresh();
                      }}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    >
                      إلغاء
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (confirm("هل أنت متأكد من حذف هذا المفتاح؟ الأنظمة المربوطة بيه هتتوقف.")) {
                        await deleteApiKey(key.id);
                        router.refresh();
                      }
                    }}
                    className="rounded-lg p-2 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
