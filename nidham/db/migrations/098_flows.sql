set client_encoding to 'UTF8';

-- ============================================================================
-- 098 — Button-menu Flows (ManyChat-style) for the Marketing Inbox
-- ============================================================================
-- A flow = nodes. Each node has a message + up to a few buttons; each button
-- points to another node. Triggered by a keyword on an incoming DM. The webhook
-- sends the start node with tappable quick-reply buttons; tapping a button
-- (which returns message.quick_reply.payload = "FLOW:<flowId>:<nodeId>") sends
-- that next node. Works on Messenger + Instagram, inside the 24h window.

create table if not exists public.marketing_flows (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references public.companies(id) on delete cascade,
  name             text not null,
  trigger_keywords text[] not null default '{}',
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);
create index if not exists idx_flows_company on public.marketing_flows(company_id, active);

create table if not exists public.marketing_flow_nodes (
  id          uuid primary key default gen_random_uuid(),
  flow_id     uuid not null references public.marketing_flows(id) on delete cascade,
  label       text not null default '',                 -- internal label
  message     text not null,
  is_start    boolean not null default false,
  buttons     jsonb not null default '[]'::jsonb,        -- [{label, next_node_id}]
  created_at  timestamptz not null default now()
);
create index if not exists idx_flow_nodes_flow on public.marketing_flow_nodes(flow_id);

alter table public.marketing_flows enable row level security;
alter table public.marketing_flow_nodes enable row level security;

drop policy if exists "manage_flows_own_company" on public.marketing_flows;
create policy "manage_flows_own_company"
  on public.marketing_flows for all
  to authenticated
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

drop policy if exists "manage_flow_nodes_own_company" on public.marketing_flow_nodes;
create policy "manage_flow_nodes_own_company"
  on public.marketing_flow_nodes for all
  to authenticated
  using (exists (
    select 1 from public.marketing_flows f
    where f.id = flow_id and f.company_id = public.current_company_id()
  ))
  with check (exists (
    select 1 from public.marketing_flows f
    where f.id = flow_id and f.company_id = public.current_company_id()
  ));

notify pgrst, 'reload schema';
