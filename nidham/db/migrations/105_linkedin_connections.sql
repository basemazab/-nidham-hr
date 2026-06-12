set client_encoding to 'UTF8';

-- ============================================================================
-- 105 — LinkedIn connection (official "Share on LinkedIn" OAuth)
-- ============================================================================
-- One connection per company. The tenant creates their own LinkedIn App
-- (free, self-serve), saves its Client ID + Secret here, then completes the
-- OAuth dance — we store the member access token (≈60 days) and the member
-- URN so the recruiter agent can publish job posts on their profile.

create table if not exists public.linkedin_connections (
  company_id       uuid primary key references public.companies(id) on delete cascade,
  client_id        text,
  client_secret    text,
  access_token     text,
  token_expires_at timestamptz,
  member_urn       text,
  member_name      text,
  connected_by     uuid,
  updated_at       timestamptz not null default now()
);

alter table public.linkedin_connections enable row level security;

drop policy if exists linkedin_connections_tenant on public.linkedin_connections;
create policy linkedin_connections_tenant on public.linkedin_connections
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
