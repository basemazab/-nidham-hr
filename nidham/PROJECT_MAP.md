# PROJECT MAP — Nidham HR

## [TECH_STACK]

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router, Turbopack) | 16.2.6 |
| **UI** | React, Tailwind CSS v4, lucide-react | 19.2.4 |
| **Language** | TypeScript | — |
| **AI SDK** | `ai` + `@ai-sdk/react` + fallback chain | 6.0.180 / 3.0.182 |
| **AI Providers** | Groq (gpt-oss-120b/20b, Llama 4 Scout) → Gemini Flash Lite | — |
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

**AI Fallback Chain:** Groq 120B → Groq 20B → Llama 4 Scout → Gemini Flash Lite

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
└── migrations/             # 78 SQL migration files (001→078)
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
