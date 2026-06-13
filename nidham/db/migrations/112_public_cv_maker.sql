set client_encoding to 'UTF8';

-- ============================================================================
-- 112 — public CV maker (standalone growth tool, no login)
-- ============================================================================
-- The public CV builder at /cv-maker is a top-of-funnel lead magnet: anyone
-- builds an ATS CV for free, gives their email to download/publish (captured
-- as a nidham_lead), and the published interactive CV carries نِظام branding.
-- Separate from the tenant `cvs` table (no company_id — these are anonymous).
--
-- usage_count lets us flip on a "1 free then paid" gate later WITHOUT a schema
-- change (per-email counter); for now everything is free.

create table if not exists public.public_cvs (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  email        text,
  data         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists idx_public_cvs_slug on public.public_cvs(slug);
create index if not exists idx_public_cvs_email on public.public_cvs(email);

alter table public.public_cvs enable row level security;

-- Anyone can READ a published public CV (the interactive page is public).
drop policy if exists public_cvs_read on public.public_cvs;
create policy public_cvs_read on public.public_cvs
  for select to anon, authenticated using (true);

-- Inserts go ONLY through the SECURITY DEFINER RPC below (not direct), so the
-- table isn't write-open to anon.

-- Save a public CV + capture the email as a vendor lead. Anonymous-callable.
create or replace function public.save_public_cv(
  p_slug   text,
  p_email  text,
  p_data   jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(p_data->>'full_name', 'مستخدم');
begin
  if length(coalesce(p_slug,'')) < 3 or p_data is null then
    raise exception 'invalid input';
  end if;

  insert into public.public_cvs (slug, email, data)
  values (p_slug, nullif(trim(coalesce(p_email,'')), ''), p_data);

  -- Capture the email as a vendor lead (best-effort; ignore dup/none).
  if nullif(trim(coalesce(p_email,'')), '') is not null then
    begin
      perform public.capture_nidham_lead(v_name, null, p_email, 'cv-maker', null);
    exception when others then
      null;
    end;
  end if;

  return p_slug;
end;
$$;

revoke all on function public.save_public_cv(text, text, jsonb) from public;
grant execute on function public.save_public_cv(text, text, jsonb) to anon, authenticated;
