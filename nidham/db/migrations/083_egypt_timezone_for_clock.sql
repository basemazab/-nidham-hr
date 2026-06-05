-- ============================================================================
-- Migration 083 — Egypt timezone for attendance clock
--
-- Adds Africa/Cairo timezone support to the attendance module so that:
--   1. Companies can set their timezone (default: Africa/Cairo)
--   2. The mobile clock-in API stores timestamps with the correct offset
--   3. Attendance queries use the company timezone for day boundaries
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Add timezone column to companies
-- ────────────────────────────────────────────────────────────────────────────
alter table public.companies
  add column if not exists timezone text not null default 'Africa/Cairo';

comment on column public.companies.timezone is
  'المنطقة الزمنية للشركة (مثال: Africa/Cairo) — تستخدم للبصمة والحضور';

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Helper RPC: returns the current time in the company's timezone
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.company_now(p_company_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select timezone(tz, now())::timestamptz
    from public.companies
   where id = p_company_id;
$$;

comment on function public.company_now(uuid) is 'الوقت الحالي بتوقيت الشركة';

grant execute on function public.company_now(uuid) to authenticated, anon;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. RPC: check whether a given UTC timestamp falls on a given date IN the
--    company's timezone.  Useful for daily attendance boundaries.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.is_same_company_date(
  p_company_id   uuid,
  p_utc_ts       timestamptz,
  p_target_date  date
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (timezone(tz, p_utc_ts))::date = p_target_date
    from public.companies
   where id = p_company_id;
$$;

grant execute on function public.is_same_company_date(uuid, timestamptz, date) to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. View that exposes attendance timestamps in the company timezone
-- ────────────────────────────────────────────────────────────────────────────
create or replace view public.attendance_with_local_time
with (security_invoker = true)
as
select a.*,
       c.timezone,
       timezone(c.timezone, a.created_at) as local_created_at,
       (timezone(c.timezone, a.created_at))::date as local_date,
       timezone(c.timezone, a.updated_at) as local_updated_at
  from public.attendance a
  join public.companies c on c.id = a.company_id;

comment on view public.attendance_with_local_time is
  'سجلات الحضور مع الوقت المحلي بتوقيت الشركة';

-- Seed existing companies with Egypt timezone if missing
update public.companies
   set timezone = 'Africa/Cairo'
 where timezone is null
   and timezone != 'Africa/Cairo';
