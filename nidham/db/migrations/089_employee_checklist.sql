-- ============================================================================
-- Migration 089 — Employee onboarding/offboarding checklist persistence
-- ============================================================================
-- The onboarding checklist actions (toggleChecklistItem / getChecklistProgress)
-- upsert into `employee_checklist`, but the table was never created — so the
-- checklist only ever lived in the browser's localStorage (not shared across
-- HR users or devices). This creates the backing table so progress persists
-- server-side, scoped per tenant.
--
-- Unique key matches the action's onConflict target: (employee_id, item_key).
-- ============================================================================

set client_encoding to 'UTF8';

create table if not exists public.employee_checklist (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  item_key    text not null,
  type        text not null default 'onboarding'
              check (type in ('onboarding', 'offboarding')),
  checked     boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (employee_id, item_key)
);

create index if not exists idx_employee_checklist_lookup
  on public.employee_checklist(company_id, employee_id, type);

alter table public.employee_checklist enable row level security;

drop policy if exists employee_checklist_all_own on public.employee_checklist;
create policy employee_checklist_all_own on public.employee_checklist
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

notify pgrst, 'reload schema';
