-- ============================================================================
-- Migration 086 — Referral program ("ادعُ شركة": شهر مجاني للطرفين)
-- ============================================================================
-- Product decision (owner): reward = 1 free month for BOTH the referrer and
-- the referred company, GRANTED AFTER super-admin approval (not automatic) —
-- the owner reviews each referral before the month is applied (anti-abuse).
--
-- Adds:
--   • companies.referral_code   — unique short code per company (auto-generated)
--   • referrals                 — one row per referred signup, status-tracked
--   • record_referral(...)      — called by the signup action (service role)
--   • approve_referral(id)      — super-admin only; extends BOTH subscriptions
--
-- Reuses existing primitives: public.current_company_id() (RLS helper) and
-- the public.super_admins table (user_id membership).
-- ============================================================================

set client_encoding to 'UTF8';

-- 1. referral_code on companies ----------------------------------------------
alter table public.companies add column if not exists referral_code text;

-- Backfill existing companies with a stable 8-char code from their id.
update public.companies
set referral_code = upper(substr(md5(id::text), 1, 8))
where referral_code is null;

create unique index if not exists idx_companies_referral_code
  on public.companies(referral_code);

-- Auto-generate a code for every new company (the handle_new_user trigger
-- inserts into companies, so this BEFORE trigger covers new signups too).
create or replace function public.tg_set_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null then
    new.referral_code :=
      upper(substr(md5(new.id::text || clock_timestamp()::text), 1, 8));
  end if;
  return new;
end; $$;

drop trigger if exists set_referral_code on public.companies;
create trigger set_referral_code
  before insert on public.companies
  for each row execute function public.tg_set_referral_code();

-- 2. referrals table ----------------------------------------------------------
create table if not exists public.referrals (
  id                    uuid primary key default gen_random_uuid(),
  referrer_company_id   uuid not null references public.companies(id) on delete cascade,
  referred_company_id   uuid references public.companies(id) on delete set null,
  referred_company_name text,
  status                text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected')),
  reward_months         integer not null default 1,
  created_at            timestamptz not null default now(),
  approved_at           timestamptz,
  approved_by           uuid
);

create index if not exists idx_referrals_referrer on public.referrals(referrer_company_id);
create index if not exists idx_referrals_status   on public.referrals(status);

alter table public.referrals enable row level security;

-- A company sees the referrals it MADE (as referrer).
drop policy if exists referrals_select_own on public.referrals;
create policy referrals_select_own on public.referrals
  for select using (referrer_company_id = public.current_company_id());

-- Super admins see every referral.
drop policy if exists referrals_select_admin on public.referrals;
create policy referrals_select_admin on public.referrals
  for select using (
    exists (select 1 from public.super_admins sa where sa.user_id = auth.uid())
  );

-- Inserts happen via record_referral() (service role on signup); approvals via
-- approve_referral() (security definer). No public write policy on purpose.

-- 3. record_referral — link a new signup to its referrer (by code) -----------
-- Called from the signup server action through the service-role client. Silent
-- no-op on unknown code or self-referral so it can never break signup.
create or replace function public.record_referral(
  p_code             text,
  p_new_company_id   uuid,
  p_new_company_name text
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_referrer uuid;
begin
  if p_code is null or btrim(p_code) = '' or p_new_company_id is null then
    return;
  end if;

  select id into v_referrer
  from public.companies
  where referral_code = upper(btrim(p_code));

  -- Unknown code or self-referral → ignore quietly.
  if v_referrer is null or v_referrer = p_new_company_id then
    return;
  end if;

  -- Avoid duplicate rows if the action retries.
  if exists (
    select 1 from public.referrals
    where referred_company_id = p_new_company_id
  ) then
    return;
  end if;

  insert into public.referrals
    (referrer_company_id, referred_company_id, referred_company_name)
  values (v_referrer, p_new_company_id, p_new_company_name);
end; $$;

-- 4. approve_referral — super-admin only; grants the reward ------------------
create or replace function public.approve_referral(p_referral_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_ref public.referrals%rowtype;
begin
  if not exists (
    select 1 from public.super_admins sa where sa.user_id = auth.uid()
  ) then
    raise exception 'غير مصرّح — للمشرف العام فقط' using errcode = 'P0001';
  end if;

  select * into v_ref from public.referrals where id = p_referral_id;
  if not found then
    raise exception 'الإحالة غير موجودة' using errcode = 'P0001';
  end if;
  if v_ref.status <> 'pending' then
    raise exception 'الإحالة اتعاملت معاها بالفعل' using errcode = 'P0001';
  end if;
  if v_ref.referred_company_id is null then
    raise exception 'الإحالة لسه ما اكتملش تسجيلها' using errcode = 'P0001';
  end if;

  -- Extend BOTH companies' subscription end date by the reward months.
  -- greatest(ends_at, current_date) so an already-expired sub extends from
  -- today, not from a past date. Reactivate an expired/cancelled sub.
  update public.subscriptions
  set ends_at = (greatest(ends_at, current_date)
                 + (v_ref.reward_months || ' months')::interval)::date,
      status  = case when status in ('expired', 'cancelled', 'past_due')
                     then 'active' else status end
  where company_id in (v_ref.referrer_company_id, v_ref.referred_company_id);

  update public.referrals
  set status = 'approved', approved_at = now(), approved_by = auth.uid()
  where id = p_referral_id;
end; $$;

grant execute on function public.approve_referral(uuid) to authenticated;

notify pgrst, 'reload schema';
