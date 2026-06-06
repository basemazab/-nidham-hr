set client_encoding to 'UTF8';

-- ============================================================================
-- 093 — Auto-reply to Facebook/Instagram post & ad COMMENTS
-- ============================================================================
-- Professional lead-gen flow: when someone comments on a page post or ad, the
-- bot posts a short PUBLIC acknowledgement under the comment AND sends the
-- commenter a PRIVATE message (DM) with the real answer — turning a public
-- comment into a tracked lead in the inbox. Each part is independently
-- toggleable.

alter table public.marketing_inbox_settings
  add column if not exists auto_reply_comments   boolean not null default false,
  add column if not exists comment_public_reply  boolean not null default true,
  add column if not exists comment_private_reply boolean not null default true,
  add column if not exists comment_public_text    text;  -- fixed public reply; null = default

comment on column public.marketing_inbox_settings.auto_reply_comments is
  'تفعيل الرد التلقائي على كومنتات البوستات/الإعلانات';

-- Dedup: Meta can resend the same comment webhook. We log every handled
-- comment_id so the bot never double-replies.
create table if not exists public.marketing_processed_comments (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  comment_id  text not null,
  created_at  timestamptz not null default now(),
  unique (comment_id)
);
create index if not exists idx_proc_comments_company on public.marketing_processed_comments(company_id);

alter table public.marketing_processed_comments enable row level security;
-- The webhook writes via the service role (bypasses RLS); members may read.
drop policy if exists proc_comments_select on public.marketing_processed_comments;
create policy proc_comments_select on public.marketing_processed_comments
  for select using (company_id = public.current_company_id());

notify pgrst, 'reload schema';
