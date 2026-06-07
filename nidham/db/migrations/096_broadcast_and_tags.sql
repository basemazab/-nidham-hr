set client_encoding to 'UTF8';

-- ============================================================================
-- 096 — Broadcast + conversation tags for the Marketing Inbox (ManyChat-style)
-- ============================================================================
-- Lets a tenant tag inbox conversations (subscribers) and send a one-off
-- message to a segment (channel / status / lead quality / tag). Sends reuse
-- the Meta page token + sendMetaMessage; each broadcast is logged for history.
-- NOTE: Messenger only delivers inside the 24h window (or with message tags) —
-- sends to older conversations fail and are counted, not silently dropped.

alter table public.marketing_inbox_conversations
  add column if not exists tags text[] not null default '{}';

create index if not exists idx_inbox_conv_tags
  on public.marketing_inbox_conversations using gin (tags);

create table if not exists public.marketing_broadcasts (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  message     text not null,
  segment     jsonb not null default '{}'::jsonb,   -- {channel,status,lead_quality,tag}
  recipients  integer not null default 0,           -- matched audience size
  sent        integer not null default 0,
  failed      integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_broadcasts_company
  on public.marketing_broadcasts(company_id, created_at desc);

alter table public.marketing_broadcasts enable row level security;

drop policy if exists "manage_broadcasts_own_company" on public.marketing_broadcasts;
create policy "manage_broadcasts_own_company"
  on public.marketing_broadcasts for all
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

drop policy if exists "super_admin_view_broadcasts" on public.marketing_broadcasts;
create policy "super_admin_view_broadcasts"
  on public.marketing_broadcasts for select
  using (public.is_super_admin());

notify pgrst, 'reload schema';
