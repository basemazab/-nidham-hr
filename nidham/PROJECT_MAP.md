# PROJECT MAP — Nidham HR

> ## ⚡ START HERE — Current state (2026-06-28)
> **Live branch = `main`** (force-synced to the live nidhamhr.com code on 2026-06-28). An older parallel `dashboard/recruitment/` experiment (Jun 15–19) is archived on branch `archive/main-recruitment-jun19` — ignore it. The **live recruitment flow lives under `dashboard/jobs/[id]/`** (jobs, applications, cv-analyzer, cv-translator, job-description).
>
> - **Deploy:** `npx vercel --prod --yes` from repo root (`nidham-hr/`, Vercel Root Directory = `nidham`); domains auto-follow. **Also `git push` to `main`** to keep GitHub in sync — historically deploys went to Vercel *without* pushing, which left GitHub 97 commits behind. Don't repeat that.
> - **Secrets:** every real key lives in Vercel env (sealed). `.env.local` is gitignored — never commit keys. NaraRouter key is read as `NARA_API_KEY || KEY_nara`.
> - **AI:** multi-provider fallback in `lib/ai-models.ts` (Gemini + Groq + NaraRouter). The 21-tool agent (`api/ai/agent/route.ts`) uses `streamText`, which **pins ONE model with no mid-stream fallback** → keep its model on a reliable tool-caller; `onError` maps failures to a friendly Arabic message. The **نِظّوم** in-system guide (`lib/guide-content.ts`) is 100% deterministic — **NO AI, never add keys/models to it**.
> - **CV intake:** `lib/cv-extract.ts` = cheap local parser → Gemini OCR fallback when output is garbage/empty/image. The applicant page **gates corrupt text** (shows a download note instead of binary salad).
> - **Open issues (NOT yet fixed):** (1) Facebook/LinkedIn auto-publish from the agent doesn't actually post (FB page likely not connected; LinkedIn `/v2/ugcPosts` likely deprecated → migrate to `/rest/posts`) — deterministic "truth cards" in `ai-agent-chat.tsx` now surface the real error in the UI. (2) CV analyzer occasional timeout. (3) Agent sometimes returns "حصل خطأ مؤقت" (Gemini overload + no in-stream fallback).
> - **Owner's working style:** get it right the **first** time — diagnose fully + verify behavior BEFORE shipping; no deploy→discover→re-fix loops. **Reply in Egyptian Arabic.**

## [TECH_STACK]

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16.2.6 |
| **UI** | React, Tailwind CSS v4, lucide-react | 19.2.4 |
| **Language** | TypeScript | — |
| **AI SDK** | `ai` + `@ai-sdk/react` + fallback chain | 6.0.180 / 3.0.182 |
| **AI Providers** | Gemini (flash/flash-lite) + Groq (gpt-oss-120b/20b, Scout) + NaraRouter — deduped fallback chain | — |
| **Embeddings** | Gemini `gemini-embedding-001` (768-dim) | — |
| **Database** | Supabase (PostgreSQL + pgvector) | — |
| **Auth** | Supabase SSR (email, autoconfirm) | — |
| **ORM** | `@supabase/supabase-js` | ^2.105.4 |
| **State** | Zustand + TanStack React Query | — |
| **Charts** | Recharts | — |
| **PDF** | jsPDF, html2canvas-pro, pdf-parse | — |
| **Map** | Leaflet + react-leaflet | — |
| **Notifications** | Sonner (toast) + Web Push (VAPID) | — |
| **Monitoring** | Sentry (tunnel: `/monitoring`) | ^10.53.1 |
| **Deploy** | Vercel (iad1) + GitHub | — |
| **Tests** | Vitest (unit), Playwright (e2e), k6 (load) | — |
| **2FA** | otpauth + QRCode.react | — |
| **Excel** | xlsx | — |
| **Validation** | Zod | — |

## [SYSTEM_FLOW]

```
User → nidhamhr.com
  ├── / (Landing / Marketing)
  ├── /login → Supabase Auth (email OTP) → session cookie
  ├── /dashboard → Middleware (RLS tenant isolation)
  │     ├── AI Chat → ai/chat + searchKnowledgeBase() + Groq/Gemini
  │     ├── Knowledge Base → ai_knowledge_base + embeddings + vector search
  │     ├── Attendance → biometric + GPS + tardiness + review batches
  │     ├── Payroll → cycle-based + deductions + incentives + EOS
  │     ├── Employees → CRUD + PII encryption + org chart
  │     ├── Contracts → e-signatures + renewals
  │     ├── Marketing → video studio + social + ads + leads
  │     ├── Automation → workflow engine (events → conditions → actions)
  │     ├── Reports → attendance + payroll + bridge
  │     └── Settings → holidays + shifts + roles + API keys
  ├── /api → 34 route files (AI, webhooks, admin, cron, v1 REST)
  └── /blog → 15 static articles (Egypt labor law, payroll, etc.)
```

**AI Fallback Chain (`lib/ai-models.ts`):** single deduped chain via `availableModels()` — NaraRouter / Gemini Flash Lite (agent default) → Gemini Flash → Groq 20B → Groq 120B → Groq Scout. Pickers: `pickAgentModel` (support tools), `pickAgentModelStreaming` (21-tool agent, Gemini-first), `pickAgentModelLargeContext` (Nara-first, non-tool), `multimodalModelChain` (file/CV OCR). `streamText` has no mid-stream fallback — `onError` → friendly Arabic.

## [ARCHITECTURE]

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # 34 API endpoints (admin, ai, webhooks, whatsapp, v1, cron)
│   ├── dashboard/          # 41 page groups (protected)
│   ├── (public)/           # landing, pricing, blog, docs
│   └── auth/               # login, signup, callback, 2FA, reset
├── lib/                    # Shared core (56 files)
│   ├── ai/                 # embeddings.ts, memory.ts, ai-models.ts (fallback chain)
│   ├── supabase/           # client, server, middleware, public, service
│   ├── workflow/           # types.ts, engine.ts, index.ts
│   ├── marketing-inbox/    # meta-client.ts, ai-reply.ts
│   ├── stores/             # ui-store.ts, index.ts
│   ├── providers/          # app-providers.tsx, query-provider.tsx
│   └── push/               # use-push-notifications.ts, config.ts
├── components/             # UI components (forms, workflow)
├── content/blog/           # 15 static blog posts (MDX-style TSX)
└── tests/                  # e2e, integration, load, uat

db/
└── migrations/             # 119 SQL migration files (up to 115_application_cvs_bucket)
```

**Key patterns:**
- `"use server"` for mutations, server components for reads
- PII encrypted via `pgcrypto` trigger → shadow columns + `employees_with_pii` view
- RLS on every table (tenant isolation via `company_id`)
- Arabic-first RTL with `font-cairo` throughout

## [VERIFIABLE_GOALS]

| # | Goal | Status |
|---|------|--------|
| 1 | PII encryption trigger fixes NULL shadows | ✅ Migration 077 applied |
| 2 | RAG mojibake fix (270 rows, WIN1252 double-encoding) | ✅ All rows clean |
| 3 | Encoding guards on all migrations | ✅ SET client_encoding TO 'UTF8' |
| 4 | Vector search functions (match_knowledge_base + full-text) | ✅ Migration 078 applied |
| 5 | KB wired to chat + agent routes | ✅ Up to 3 docs injected |
| 6 | Embedding generation for all 432 KB documents | ✅ gemini-embedding-001, 768-dim |
| 7 | Video renderer (canvas + MediaRecorder + AudioEngine) | ✅ 60fps, crossfade, particles |
| 8 | Workflow automation engine | ✅ 7 event types, 8 action types |
| 9 | Temporary admin endpoints removed | ✅ fix-workflows + generate-embeddings deleted |
| 10 | GROQ_API_KEY for AI redundancy | ✅ Set in Vercel (production + development) |
| 11 | VAPID push keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_SUBJECT) | ✅ Generated via web-push, set in Vercel |
| 12 | META encryption + webhook verify tokens (META_ENCRYPTION_KEY, META_WEBHOOK_VERIFY_TOKEN, WHATSAPP_VERIFY_TOKEN) + CRON_SECRET | ✅ Generated as random base64url, set in Vercel |
| 13 | Public-repo Gemini key leak (`.envGEMINI_API_KEY=AIza...` file committed since first commit) | ✅ File removed (3056b97), `hr-mostashar/.gitignore` widened to `.env*` |

## [ORPHANS_AND_PENDING]

| Item | Type | Notes |
|------|------|-------|
| `META_APP_ID`, `META_APP_SECRET`, `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ Missing | Meta ads / Facebook Leads integration. Get from Meta Developer Console (app settings + Events Manager). |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | ⚠️ Missing | WhatsApp Business send/receive. Needs Meta WhatsApp Business API onboarding (phone number + permanent access token). |
| Revoke leaked Gemini key on Google side | ⚠️ User action | The leaked `AIzaSy...JPY...` is removed from current repo state but remains in git history. Revoke at https://aistudio.google.com/apikey for full hygiene. |
| SSO / OAuth providers | 🔲 Future | حالياً email-only. Google/Apple OAuth ممكن |
| Multi-language UI | 🔲 Future | Arabic only حالياً. English i18n scaffolding في `lib/i18n.ts` |
| E2E tests in CI | 🔲 Future | Playwright tests موجودة بس مش شغالة في CI |
| k6 load tests | 🔲 Future | Scripts موجودة في `tests/load/` لكن محتاجة CI pipeline |
