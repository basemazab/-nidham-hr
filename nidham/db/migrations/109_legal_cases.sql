set client_encoding to 'UTF8';

-- ============================================================================
-- 109 — المستشار القانوني: legal cases (investigation + AI legal opinion)
-- ============================================================================
-- HR opens a case about an employee (theft, absence, misconduct...), the tool
-- generates formal investigation questions, HR records the employee's answers,
-- then the AI writes a legal opinion grounded in Egyptian Labor Law 12/2003
-- with the graduated penalty, procedural safeguards, and (for crimes) the
-- reporting steps — plus printable investigation-record + penalty-decision
-- drafts. ADVISORY ONLY (not a substitute for a licensed lawyer).

create table if not exists public.legal_cases (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  employee_name   text not null,
  employee_title  text,
  case_type       text not null,
  description     text not null,
  evidence        text,
  questions       jsonb,         -- string[]
  answers         jsonb,         -- { question, answer }[]
  opinion         jsonb,         -- structured legal opinion
  status          text not null default 'open'
                  check (status in ('open', 'investigated', 'opined', 'closed')),
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_legal_cases_company
  on public.legal_cases(company_id, created_at desc);

alter table public.legal_cases enable row level security;

drop policy if exists legal_cases_tenant on public.legal_cases;
create policy legal_cases_tenant on public.legal_cases
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
