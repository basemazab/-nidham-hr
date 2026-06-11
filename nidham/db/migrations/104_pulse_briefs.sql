set client_encoding to 'UTF8';

-- ============================================================================
-- 104 — نبض نيدهام (Nidham Pulse): daily AI executive briefing
-- ============================================================================
-- One brief per company per day. The brief is generated from a cross-module
-- scan (attendance, leaves, advances, payroll cost, expiring documents,
-- ending CRM contracts, new/hot leads, inbox handoffs, birthdays and work
-- anniversaries) and written by the AI as a prioritized action list.
--
-- items: [{severity, category, title, detail, action}]
-- stats: {headcount, present, absent, late, pendingLeaves, newLeads7d, ...}

create table if not exists public.pulse_briefs (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  brief_date    date not null,
  headline      text not null,
  health_score  int  not null default 50 check (health_score between 0 and 100),
  items         jsonb not null default '[]'::jsonb,
  stats         jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  unique (company_id, brief_date)
);

create index if not exists idx_pulse_briefs_company_date
  on public.pulse_briefs(company_id, brief_date desc);

alter table public.pulse_briefs enable row level security;

drop policy if exists pulse_briefs_tenant on public.pulse_briefs;
create policy pulse_briefs_tenant on public.pulse_briefs
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
