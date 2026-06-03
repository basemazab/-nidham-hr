-- ============================================================================
-- Migration 087 — Company document & license expiry tracker
-- ============================================================================
-- Every Egyptian company juggles documents that EXPIRE and trigger fines or
-- closure if they lapse: السجل التجاري، البطاقة الضريبية، التراخيص، شهادة
-- الدفاع المدني، عقود الموظفين، تصاريح العمل. There was no central place to
-- track them. This table powers /dashboard/documents AND feeds the Compliance
-- Shield (a document within its reminder window → a surfaced risk).
--
-- RLS via the existing public.current_company_id() helper, identical to the
-- pattern on employees / leave_balances.
-- ============================================================================

set client_encoding to 'UTF8';

create table if not exists public.company_documents (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  name          text not null,
  category      text not null default 'other'
                check (category in (
                  'commercial_register', -- السجل التجاري
                  'tax_card',            -- البطاقة الضريبية
                  'license',             -- ترخيص
                  'insurance',           -- شهادة تأمين
                  'civil_defense',       -- الدفاع المدني
                  'contract',            -- عقد
                  'permit',              -- تصريح
                  'other'
                )),
  expiry_date   date not null,
  reminder_days integer not null default 30 check (reminder_days >= 0),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_company_documents_company
  on public.company_documents(company_id);
create index if not exists idx_company_documents_expiry
  on public.company_documents(company_id, expiry_date);

alter table public.company_documents enable row level security;

drop policy if exists company_documents_all_own on public.company_documents;
create policy company_documents_all_own on public.company_documents
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

notify pgrst, 'reload schema';
