set client_encoding to 'UTF8';

-- ============================================================================
-- 113 — أداة التواصل مع العملاء المحتملين (Outreach / Leads)
-- ============================================================================
-- A PRIVATE per-company prospecting board: the owner imports cold B2B leads
-- (name + phone + sector), then sends each one a WhatsApp message MANUALLY via
-- a one-tap wa.me deep-link (pre-filled, personalized). The system tracks the
-- pipeline status + last-contacted time so we can show a safe daily counter.
--
-- IMPORTANT: this is NOT an auto-sender. WhatsApp bans numbers that blast cold
-- automated messages, so every send is a human tap on the user's own device.
-- We only store the leads + status; we never message on the user's behalf.

create table if not exists public.outreach_leads (
  id                uuid primary key default gen_random_uuid(),
  company_id        uuid not null references public.companies(id) on delete cascade,
  name              text not null,
  phone             text,                       -- local format e.g. 01001234567
  sector            text,                       -- المجال
  city              text,
  website           text,
  email             text,
  status            text not null default 'new'
                    check (status in ('new','messaged','replied','demo','customer','not_interested')),
  notes             text,
  source            text,                        -- e.g. "مصانع العاشر من رمضان"
  last_contacted_at timestamptz,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_outreach_company on public.outreach_leads(company_id, status);
create index if not exists idx_outreach_contacted on public.outreach_leads(company_id, last_contacted_at);

alter table public.outreach_leads enable row level security;

-- Strict tenant isolation — each company sees only its own leads.
drop policy if exists outreach_leads_tenant on public.outreach_leads;
create policy outreach_leads_tenant on public.outreach_leads
  for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

drop trigger if exists outreach_leads_set_updated_at on public.outreach_leads;
create trigger outreach_leads_set_updated_at
  before update on public.outreach_leads
  for each row execute function public.tg_set_updated_at();
