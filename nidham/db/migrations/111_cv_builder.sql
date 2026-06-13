set client_encoding to 'UTF8';

-- ============================================================================
-- 111 — بانية السيرة الذاتية: ATS-optimized CV builder + public interactive page
-- ============================================================================
-- Each CV belongs to a company (HR builds CVs for candidates/employees, or the
-- owner builds their own). `data` holds the structured CV (jsonb). `slug` (when
-- published) powers a public interactive web version at /cv/{slug}.

create table if not exists public.cvs (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  title        text not null default 'سيرة ذاتية',
  target_role  text,
  data         jsonb not null default '{}'::jsonb,
  ats_score    int,
  ats_review   jsonb,
  slug         text unique,
  is_public    boolean not null default false,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_cvs_company on public.cvs(company_id, updated_at desc);
create index if not exists idx_cvs_slug on public.cvs(slug) where slug is not null;

alter table public.cvs enable row level security;

drop policy if exists cvs_tenant on public.cvs;
create policy cvs_tenant on public.cvs
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

-- Public read of PUBLISHED cvs (for the /cv/{slug} interactive page, served by
-- the anon client). Only published rows, only via slug.
drop policy if exists cvs_public_read on public.cvs;
create policy cvs_public_read on public.cvs
  for select
  to anon, authenticated
  using (is_public = true);
