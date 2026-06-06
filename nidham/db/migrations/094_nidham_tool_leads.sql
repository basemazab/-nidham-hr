set client_encoding to 'UTF8';

-- ============================================================================
-- 094 — Vendor lead capture from the public free tools (lead magnets)
-- ============================================================================
-- People who use Nidham's PUBLIC calculators (salary / EOS / insurance / tax …)
-- can leave their contact info. These are leads for NIDHAM ITSELF (the SaaS
-- vendor) — kept separate from each tenant's CRM customers. Only platform
-- super-admins can read them; the public capture goes through a SECURITY
-- DEFINER RPC granted to anonymous visitors.

create table if not exists public.nidham_leads (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  phone       text,
  email       text,
  source      text not null default 'tool',   -- which tool/page captured it
  message     text,
  status      text not null default 'new'
              check (status in ('new', 'contacted', 'qualified', 'converted', 'spam')),
  created_at  timestamptz not null default now()
);
create index if not exists idx_nidham_leads_created on public.nidham_leads(created_at desc);

alter table public.nidham_leads enable row level security;

-- Only platform super-admins read/manage vendor leads.
drop policy if exists nidham_leads_super on public.nidham_leads;
create policy nidham_leads_super on public.nidham_leads
  for all
  using (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid()))
  with check (exists (select 1 from public.super_admins sa where sa.user_id = auth.uid()));

-- Public capture RPC — anonymous tool visitors call this. Validates that at
-- least one contact channel is present and caps field lengths (anti-abuse).
create or replace function public.capture_nidham_lead(
  p_name    text,
  p_phone   text,
  p_email   text,
  p_source  text,
  p_message text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(p_phone), '') = '' and coalesce(trim(p_email), '') = '' then
    raise exception 'لازم رقم موبايل أو إيميل';
  end if;
  insert into public.nidham_leads (name, phone, email, source, message)
  values (
    nullif(left(trim(coalesce(p_name, '')), 120), ''),
    nullif(left(trim(coalesce(p_phone, '')), 40), ''),
    nullif(left(trim(coalesce(p_email, '')), 160), ''),
    nullif(left(trim(coalesce(p_source, 'tool')), 60), ''),
    nullif(left(trim(coalesce(p_message, '')), 500), '')
  );
end;
$$;

grant execute on function public.capture_nidham_lead(text, text, text, text, text)
  to anon, authenticated;

notify pgrst, 'reload schema';
