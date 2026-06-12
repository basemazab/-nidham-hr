set client_encoding to 'UTF8';

-- ============================================================================
-- 108 — مهندس النظام: dev requests (bug reports + feature requests)
-- ============================================================================
-- The in-app "System Engineer" page files structured tickets with a live
-- diagnostics snapshot attached, so fixing/building starts with full context
-- instead of a vague description.

create table if not exists public.dev_requests (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  kind         text not null default 'bug' check (kind in ('bug', 'feature')),
  title        text not null,
  details      text,
  diagnostics  jsonb,
  status       text not null default 'new'
               check (status in ('new', 'in_progress', 'done', 'rejected')),
  created_by   uuid,
  created_at   timestamptz not null default now()
);

create index if not exists idx_dev_requests_company
  on public.dev_requests(company_id, created_at desc);

alter table public.dev_requests enable row level security;

drop policy if exists dev_requests_tenant on public.dev_requests;
create policy dev_requests_tenant on public.dev_requests
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
