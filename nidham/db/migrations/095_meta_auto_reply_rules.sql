set client_encoding to 'UTF8';

-- ============================================================================
-- 095 — Keyword auto-reply rules (ManyChat-style) for the Marketing Inbox
-- ============================================================================
-- Deterministic keyword → reply rules that the Meta webhook checks BEFORE the
-- AI. A rule fires on incoming DMs and/or on comments (private reply), works
-- even when the AI is turned off. Tenant-scoped; the webhook reads them with
-- the service role (bypasses RLS), the dashboard manages them under RLS.

create table if not exists public.marketing_auto_reply_rules (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,

  -- Trigger words (any match fires the rule).
  keywords      text[] not null default '{}',
  -- The reply text to send when a keyword matches.
  response      text not null,
  -- "contains" = message includes the keyword; "exact" = whole message equals it.
  match_type    text not null default 'contains'
                check (match_type in ('contains', 'exact')),

  -- Which surfaces this rule applies to.
  apply_dm      boolean not null default true,
  apply_comment boolean not null default true,

  active        boolean not null default true,
  -- Higher priority is checked first (first match wins).
  priority      integer not null default 0,

  created_at    timestamptz not null default now()
);

create index if not exists idx_auto_reply_rules_company
  on public.marketing_auto_reply_rules(company_id, active, priority desc);

alter table public.marketing_auto_reply_rules enable row level security;

-- Tenant read/write within their own company.
drop policy if exists "manage_auto_reply_rules_own_company" on public.marketing_auto_reply_rules;
create policy "manage_auto_reply_rules_own_company"
  on public.marketing_auto_reply_rules for all
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- Platform super-admin visibility (consistent with other tenant tables).
drop policy if exists "super_admin_view_auto_reply_rules" on public.marketing_auto_reply_rules;
create policy "super_admin_view_auto_reply_rules"
  on public.marketing_auto_reply_rules for select
  using (public.is_super_admin());

notify pgrst, 'reload schema';
