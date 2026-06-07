set client_encoding to 'UTF8';

-- ============================================================================
-- 097 — Sequences (scheduled drip messages) for the Marketing Inbox
-- ============================================================================
-- A sequence = ordered steps, each "wait N hours then send this message".
-- A tenant enrolls a SEGMENT of inbox conversations; the /api/cron/run-sequences
-- cron walks due enrollments, sends the next step via the Meta page token, and
-- advances. Same 24h-window caveat as broadcasts.

create table if not exists public.marketing_sequences (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists idx_sequences_company on public.marketing_sequences(company_id);

create table if not exists public.marketing_sequence_steps (
  id          uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.marketing_sequences(id) on delete cascade,
  step_order  integer not null default 0,
  delay_hours integer not null default 24,   -- wait this long before sending this step
  message     text not null
);
create index if not exists idx_sequence_steps_seq on public.marketing_sequence_steps(sequence_id, step_order);

create table if not exists public.marketing_sequence_enrollments (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  sequence_id     uuid not null references public.marketing_sequences(id) on delete cascade,
  conversation_id uuid not null references public.marketing_inbox_conversations(id) on delete cascade,
  current_step    integer not null default 0,
  status          text not null default 'active'
                  check (status in ('active', 'done', 'stopped')),
  next_run_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (sequence_id, conversation_id)
);
-- The cron scans by (status, next_run_at) across all tenants.
create index if not exists idx_seq_enroll_due
  on public.marketing_sequence_enrollments(status, next_run_at);
create index if not exists idx_seq_enroll_company
  on public.marketing_sequence_enrollments(company_id);

alter table public.marketing_sequences enable row level security;
alter table public.marketing_sequence_steps enable row level security;
alter table public.marketing_sequence_enrollments enable row level security;

-- Tenant manage their own sequences.
drop policy if exists "manage_sequences_own_company" on public.marketing_sequences;
create policy "manage_sequences_own_company"
  on public.marketing_sequences for all
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- Steps: scoped through the parent sequence's company.
drop policy if exists "manage_sequence_steps_own_company" on public.marketing_sequence_steps;
create policy "manage_sequence_steps_own_company"
  on public.marketing_sequence_steps for all
  to authenticated
  using (exists (
    select 1 from public.marketing_sequences s
    where s.id = sequence_id and s.company_id = public.current_company_id()
  ))
  with check (exists (
    select 1 from public.marketing_sequences s
    where s.id = sequence_id and s.company_id = public.current_company_id()
  ));

drop policy if exists "manage_seq_enrollments_own_company" on public.marketing_sequence_enrollments;
create policy "manage_seq_enrollments_own_company"
  on public.marketing_sequence_enrollments for all
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

notify pgrst, 'reload schema';
