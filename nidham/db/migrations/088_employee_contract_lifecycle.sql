-- ============================================================================
-- Migration 088 — Employee contract lifecycle (type + start + end)
-- ============================================================================
-- Fixed-term contracts (عقد محدد المدة) are the single biggest source of
-- Egyptian labour disputes: if a fixed-term contract lapses and the employee
-- keeps working without a WRITTEN renewal, the law converts it to an
-- indefinite contract — and any later termination becomes a costly dispute.
--
-- These columns let the employer record the contract type + dates, and feed
-- the Compliance Shield (a fixed-term contract expiring soon → "renew in
-- writing or decide"; already expired + still active → high-risk alert).
--
-- Existing rows default to 'indefinite' (the safe assumption — no expiry).
-- ============================================================================

set client_encoding to 'UTF8';

alter table public.employees
  add column if not exists contract_type text not null default 'indefinite'
    check (contract_type in ('fixed', 'indefinite')),
  add column if not exists contract_start date,
  add column if not exists contract_end date;

create index if not exists idx_employees_contract_end
  on public.employees(company_id, contract_end)
  where contract_end is not null;

notify pgrst, 'reload schema';
