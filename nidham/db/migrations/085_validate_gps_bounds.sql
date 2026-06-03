-- ============================================================================
-- Migration 085 — Reject impossible GPS coordinates on mobile clock-in/out
-- ============================================================================
-- mobile_clock_in / mobile_clock_out (migration 083) trust whatever lat/lng
-- the client RPC payload sends. Three failure modes that were silently
-- accepted before this migration:
--
--   1) NULL lat or lng       → distance = NULL → outside_geofence = NULL,
--      strict mode happens to allow the punch (line 81 short-circuits on
--      v_outside). A determined attacker could spoof this trivially.
--   2) Out-of-range values   → lat outside [-90, 90] or lng outside [-180, 180]
--      pass the radians()/asin() math but return non-sensical distances. An
--      attacker who knows the office is at +30/+31 can submit (-30, -31) and
--      compute the distance from there.
--   3) Null Island (0, 0)    → middle of the Atlantic; what every "GPS not
--      yet acquired" client erroneously sends as a fallback. The DB has no
--      way to distinguish this from a real (0, 0) and trusts the number.
--
-- This migration adds a single defensive block at the top of each function
-- that rejects all three. Honest clients that have a real GPS fix are
-- unaffected. The exception is bilingual so the surfaced error gives HR a
-- chance to debug the device rather than just saying "invalid".
--
-- Bodies are otherwise identical to migration 083. NO breaking changes to
-- the return signature or grants.
-- ============================================================================

SET client_encoding TO 'UTF8';

-- ----------------------------------------------------------------------------
-- mobile_clock_in — same body as 083 plus the validation guard at step 0.
-- ----------------------------------------------------------------------------
create or replace function public.mobile_clock_in(
  p_lat        numeric,
  p_lng        numeric,
  p_device_id  text default null
) returns table (
  attendance_id      uuid,
  distance_meters    numeric,
  outside_geofence   boolean,
  geofence_enabled   boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp_id            uuid;
  v_company_id        uuid;
  v_office_lat        numeric;
  v_office_lng        numeric;
  v_office_radius     integer;
  v_geofence_enabled  boolean;
  v_distance          numeric;
  v_outside           boolean;
  -- Business day in Egypt local time (UTC+2, no DST) — NOT the UTC date,
  -- which rolls over at 02:00 Cairo and mis-files after-midnight punches.
  v_today             date := (now() at time zone 'Africa/Cairo')::date;
  v_row_id            uuid;
begin
  -- 0. GPS bounds guard. Three classes of obviously-fake input.
  --    Null Island (0,0) is rejected as a proxy for "no GPS fix" — a real
  --    fix is never exactly (0,0) to numeric precision.
  if p_lat is null or p_lng is null then
    raise exception 'إحداثيات GPS مفقودة — تأكد إن خاصية الموقع شغّالة في الموبايل'
      using errcode = 'P0001';
  end if;
  if p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise exception 'إحداثيات GPS غير صالحة (lat=%,lng=%)', p_lat, p_lng
      using errcode = 'P0001';
  end if;
  if p_lat = 0 and p_lng = 0 then
    raise exception 'الـGPS لسه ما لقاش إشارة — استنى ثوانٍ وحاول تاني'
      using errcode = 'P0001';
  end if;

  -- 1. Resolve the caller (aliased so e.user_id isn't ambiguous)
  select e.id, e.company_id
    into v_emp_id, v_company_id
  from public.employees e
  where e.user_id = auth.uid();

  if v_emp_id is null then
    raise exception 'حسابك مش متربط بأي موظف' using errcode = 'P0001';
  end if;

  -- 2. Read the company's geofence config (aliased -> qualified)
  select c.office_lat, c.office_lng, c.office_radius_meters, c.geofence_enabled
    into v_office_lat, v_office_lng, v_office_radius, v_geofence_enabled
  from public.companies c
  where c.id = v_company_id;

  -- 3. Distance via Haversine when an office location is set
  if v_office_lat is not null and v_office_lng is not null then
    v_distance := 6371000 * 2 * asin(sqrt(
      power(sin(radians(p_lat - v_office_lat) / 2), 2)
      + cos(radians(v_office_lat)) * cos(radians(p_lat))
        * power(sin(radians(p_lng - v_office_lng) / 2), 2)
    ));
    v_outside := v_distance > coalesce(v_office_radius, 100);
  else
    v_distance := null;
    v_outside  := null;
  end if;

  -- 4. Strict mode rejects an out-of-radius clock-in
  if coalesce(v_geofence_enabled, false) and v_outside then
    raise exception 'مش في مكان العمل (المسافة %m)', round(v_distance)
      using errcode = 'P0001';
  end if;

  -- 5. Upsert today's attendance row (aliased to avoid the same trap)
  insert into public.attendance as a (
    company_id, employee_id, date, status,
    check_in_at, check_in_lat, check_in_lng,
    check_in_distance_meters, check_in_outside_geofence,
    device_id, source
  )
  values (
    v_company_id, v_emp_id, v_today, 'present',
    now(), p_lat, p_lng,
    v_distance, v_outside,
    p_device_id, 'mobile_app'
  )
  on conflict (employee_id, date) do update set
    status = 'present',
    check_in_at = excluded.check_in_at,
    check_in_lat = excluded.check_in_lat,
    check_in_lng = excluded.check_in_lng,
    check_in_distance_meters = excluded.check_in_distance_meters,
    check_in_outside_geofence = excluded.check_in_outside_geofence,
    device_id = excluded.device_id,
    source = case when a.source = 'manual' then 'mobile_app' else a.source end
  returning a.id into v_row_id;

  -- 6. Return -- alias every OUT parameter so the planner has no doubt.
  return query select
    v_row_id                          as attendance_id,
    v_distance                        as distance_meters,
    v_outside                         as outside_geofence,
    coalesce(v_geofence_enabled, false) as geofence_enabled;
end;
$$;

grant execute on function public.mobile_clock_in(numeric, numeric, text) to authenticated;


-- ----------------------------------------------------------------------------
-- mobile_clock_out — same body as 083 plus the same guard.
-- ----------------------------------------------------------------------------
create or replace function public.mobile_clock_out(
  p_lat       numeric,
  p_lng       numeric,
  p_device_id text default null
) returns table (
  attendance_id    uuid,
  distance_meters  numeric,
  outside_geofence boolean,
  hours_worked     numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp_id            uuid;
  v_company_id        uuid;
  v_office_lat        numeric;
  v_office_lng        numeric;
  v_office_radius     integer;
  v_distance          numeric;
  v_outside           boolean;
  -- Same Egypt-local business day as mobile_clock_in.
  v_today             date := (now() at time zone 'Africa/Cairo')::date;
  v_row_id            uuid;
  v_check_in_at       timestamptz;
  v_hours             numeric;
begin
  -- 0. Same GPS bounds guard as mobile_clock_in. Punching OUT off-site is
  --    just as exploitable for "I left early but forged a punch from home".
  if p_lat is null or p_lng is null then
    raise exception 'إحداثيات GPS مفقودة — تأكد إن خاصية الموقع شغّالة في الموبايل'
      using errcode = 'P0001';
  end if;
  if p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise exception 'إحداثيات GPS غير صالحة (lat=%,lng=%)', p_lat, p_lng
      using errcode = 'P0001';
  end if;
  if p_lat = 0 and p_lng = 0 then
    raise exception 'الـGPS لسه ما لقاش إشارة — استنى ثوانٍ وحاول تاني'
      using errcode = 'P0001';
  end if;

  select e.id, e.company_id
    into v_emp_id, v_company_id
  from public.employees e
  where e.user_id = auth.uid();

  if v_emp_id is null then
    raise exception 'حسابك مش متربط بأي موظف' using errcode = 'P0001';
  end if;

  select c.office_lat, c.office_lng, c.office_radius_meters
    into v_office_lat, v_office_lng, v_office_radius
  from public.companies c
  where c.id = v_company_id;

  if v_office_lat is not null and v_office_lng is not null then
    v_distance := 6371000 * 2 * asin(sqrt(
      power(sin(radians(p_lat - v_office_lat) / 2), 2)
      + cos(radians(v_office_lat)) * cos(radians(p_lat))
        * power(sin(radians(p_lng - v_office_lng) / 2), 2)
    ));
    v_outside := v_distance > coalesce(v_office_radius, 100);
  else
    v_distance := null;
    v_outside  := null;
  end if;

  -- Locate today's row -- must already exist (created by clock-in)
  select a.id, a.check_in_at
    into v_row_id, v_check_in_at
  from public.attendance a
  where a.employee_id = v_emp_id and a.date = v_today;

  if v_row_id is null then
    raise exception 'لازم تثبت حضور الأول' using errcode = 'P0001';
  end if;

  if v_check_in_at is not null then
    v_hours := round(extract(epoch from (now() - v_check_in_at)) / 3600.0, 2);
  end if;

  update public.attendance as a set
    check_out_at = now(),
    check_out_lat = p_lat,
    check_out_lng = p_lng,
    check_out_distance_meters = v_distance,
    check_out_outside_geofence = v_outside,
    device_id = coalesce(p_device_id, a.device_id),
    hours_worked = v_hours
  where a.id = v_row_id;

  return query select
    v_row_id   as attendance_id,
    v_distance as distance_meters,
    v_outside  as outside_geofence,
    v_hours    as hours_worked;
end;
$$;

grant execute on function public.mobile_clock_out(numeric, numeric, text) to authenticated;


notify pgrst, 'reload schema';
