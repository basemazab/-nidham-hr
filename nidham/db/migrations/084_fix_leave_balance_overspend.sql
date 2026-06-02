-- ============================================================================
-- Migration 084 — Prevent leave-balance overspend (TOCTOU + approval guard)
-- ============================================================================
-- Two gaps in the migration-018 leave flow let an employee take more days
-- than they're entitled to:
--
--   1. mobile_create_leave_request read `remaining = entitled + carried -
--      used_days` with NO row lock, then inserted. Two requests submitted
--      together both read the same remaining and both pass. Worse, used_days
--      only changes at APPROVAL, so an employee could stack several pending
--      requests that each fit the balance but collectively bust it.
--
--   2. tg_leave_request_balance added `used_days + days_count` on approval
--      with NO cap, so an over-draw silently passed and was only hidden by
--      the greatest(0, ...) clamp in the display RPCs (HR saw "0 remaining"
--      while the employee took 25 of 21 days).
--
-- Fix 1: lock the balance row FOR UPDATE and subtract outstanding pending
--        days before approving the new request.
-- Fix 2: on approval, lock + check the balance and REFUSE if it would push
--        used_days past the entitlement.
-- Function bodies are otherwise identical to migration 018.
-- ============================================================================

SET client_encoding TO 'UTF8';

-- ----------------------------------------------------------------------------
-- Fix 1 — mobile_create_leave_request: atomic balance check
-- ----------------------------------------------------------------------------
create or replace function public.mobile_create_leave_request(
  p_leave_type  text,
  p_start_date  date,
  p_end_date    date,
  p_reason      text default null
) returns table (
  request_id   uuid,
  days_count   numeric,
  remaining_balance numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
  v_company_id  uuid;
  v_days        numeric;
  v_year        integer;
  v_remaining   numeric;
  v_pending     numeric := 0;
  v_existing    boolean;
  v_request_id  uuid;
begin
  -- Resolve caller
  select e.id, e.company_id into v_employee_id, v_company_id
  from public.employees e where e.user_id = auth.uid();

  if v_employee_id is null then
    raise exception 'حسابك مش متربط بأي موظف' using errcode = 'P0001';
  end if;

  -- Validate dates
  if p_start_date is null or p_end_date is null then
    raise exception 'لازم تحدد تاريخ البداية والنهاية' using errcode = 'P0001';
  end if;
  if p_end_date < p_start_date then
    raise exception 'تاريخ النهاية لازم بعد تاريخ البداية' using errcode = 'P0001';
  end if;
  if p_start_date < current_date - interval '7 days' then
    raise exception 'مينفعش تطلب إجازة عن فترة قديمة أكتر من أسبوع' using errcode = 'P0001';
  end if;

  v_days := (p_end_date - p_start_date) + 1;
  v_year := extract(year from p_start_date)::int;

  -- Validate type
  if p_leave_type not in ('annual','casual','sick','unpaid','maternity','hajj','bereavement','other') then
    raise exception 'نوع الإجازة مش معروف' using errcode = 'P0001';
  end if;

  -- For balance-gated types, check sufficient balance UNDER A ROW LOCK so
  -- concurrent requests for the same employee/year/type can't both pass the
  -- same stale remaining (TOCTOU overspend).
  if p_leave_type in ('annual','casual','sick') then
    select entitled_days + carried_over - used_days
      into v_remaining
    from public.leave_balances
    where employee_id = v_employee_id
      and year = v_year
      and leave_type = p_leave_type
    for update;

    if v_remaining is null then
      raise exception 'مفيش رصيد إجازات مسجّل للسنة دي -- كلّم HR' using errcode = 'P0001';
    end if;

    -- used_days only moves at approval, so ALSO subtract days already held by
    -- other outstanding pending requests of the same type/year. Combined with
    -- the FOR UPDATE above, a second concurrent request sees the first one's
    -- committed pending row and is rejected when the balance is short.
    select coalesce(sum(days_count), 0)
      into v_pending
    from public.leave_requests
    where employee_id = v_employee_id
      and status = 'pending'
      and leave_type = p_leave_type
      and extract(year from start_date)::int = v_year;

    v_remaining := v_remaining - v_pending;

    if v_remaining < v_days then
      raise exception 'الرصيد غير كافٍ -- متبقي % يوم بس', round(greatest(0, v_remaining), 1) using errcode = 'P0001';
    end if;
  end if;

  -- Check for overlap with existing pending/approved requests
  select exists (
    select 1 from public.leave_requests
    where employee_id = v_employee_id
      and status in ('pending', 'approved')
      and not (end_date < p_start_date or start_date > p_end_date)
  ) into v_existing;

  if v_existing then
    raise exception 'في طلب إجازة تاني في نفس الفترة' using errcode = 'P0001';
  end if;

  -- Insert
  insert into public.leave_requests
    (company_id, employee_id, leave_type, start_date, end_date, days_count, reason, status)
  values
    (v_company_id, v_employee_id, p_leave_type, p_start_date, p_end_date, v_days, p_reason, 'pending')
  returning id into v_request_id;

  return query select v_request_id, v_days, coalesce(v_remaining - v_days, 0::numeric);
end;
$$;

grant execute on function public.mobile_create_leave_request(text, date, date, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Fix 2 — tg_leave_request_balance: cap used_days at the entitlement
-- ----------------------------------------------------------------------------
create or replace function public.tg_leave_request_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer;
  v_entitled numeric;
  v_used numeric;
begin
  v_year := extract(year from new.start_date)::int;

  if tg_op = 'UPDATE'
     and old.status != 'approved'
     and new.status = 'approved'
     and new.leave_type in ('annual', 'casual', 'sick') then
    -- Lock + read the balance, then REFUSE the approval if it would push
    -- used_days past the entitlement. Previously this added unconditionally,
    -- so stacked/duplicate approvals silently drove the balance negative
    -- (masked by greatest(0, ...) in the display RPCs).
    select entitled_days + carried_over, used_days
      into v_entitled, v_used
    from public.leave_balances
    where employee_id = new.employee_id
      and year = v_year
      and leave_type = new.leave_type
    for update;

    if v_entitled is null then
      raise exception 'مفيش رصيد إجازات مسجّل للسنة دي -- كلّم HR' using errcode = 'P0001';
    end if;

    if v_used + new.days_count > v_entitled then
      raise exception 'الموافقة هتتعدّى الرصيد: متبقي % يوم والطلب % يوم',
        round(greatest(0, v_entitled - v_used), 1), new.days_count
        using errcode = 'P0001';
    end if;

    update public.leave_balances
       set used_days = used_days + new.days_count
     where employee_id = new.employee_id
       and year = v_year
       and leave_type = new.leave_type;
  end if;

  -- Approved -> rejected/cancelled: restore the days.
  if tg_op = 'UPDATE'
     and old.status = 'approved'
     and new.status in ('rejected', 'cancelled')
     and new.leave_type in ('annual', 'casual', 'sick') then
    update public.leave_balances
       set used_days = greatest(0, used_days - new.days_count)
     where employee_id = new.employee_id
       and year = v_year
       and leave_type = new.leave_type;
  end if;

  return new;
end;
$$;


notify pgrst, 'reload schema';
