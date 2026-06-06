-- ============================================================================
-- Migration 084 — Leave balance overspend prevention
--
-- A BEFORE UPDATE trigger on leave_requests that rejects approval when the
-- remaining balance is insufficient.  Covers the HR dashboard path (the
-- mobile_create_leave_request RPC already validates balance at submit time).
--
-- Also prevents the tg_leave_request_balance() AFTER trigger from pushing
-- used_days past entitled_days.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. BEFORE UPDATE trigger: reject approval if balance insufficient
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.tg_check_leave_balance_before_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining numeric;
  v_year      integer;
begin
  -- Only fire when transitioning TO approved
  if tg_op = 'UPDATE'
     and old.status != 'approved'
     and new.status = 'approved'
     and new.leave_type in ('annual', 'casual', 'sick') then

    v_year := extract(year from new.start_date)::int;

    select greatest(0, entitled_days + carried_over - used_days)
      into v_remaining
      from public.leave_balances
     where employee_id = new.employee_id
       and year = v_year
       and leave_type = new.leave_type;

    if v_remaining is null then
      raise exception 'الموظف ليس له رصيد إجازات مسجل لهذه السنة (%)
 — يجب إضافة رصيد أولاً', v_year
        using errcode = 'P0001';
    end if;

    if v_remaining < new.days_count then
      raise exception 'لا يمكن الموافقة — الرصيد المتبقي (% يوم) أقل من أيام الإجازة (% يوم)',
        round(v_remaining, 1), new.days_count
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists leave_requests_check_balance on public.leave_requests;
create trigger leave_requests_check_balance
  before update on public.leave_requests
  for each row execute function public.tg_check_leave_balance_before_approve();

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Harden tg_leave_request_balance so it never pushes used_days past
--    entitled_days + carried_over (belt-and-suspenders).
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.tg_leave_request_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year      integer;
  v_max       numeric;
  v_new_used  numeric;
begin
  v_year := extract(year from new.start_date)::int;

  if tg_op = 'UPDATE'
     and old.status != 'approved'
     and new.status = 'approved'
     and new.leave_type in ('annual', 'casual', 'sick') then

    -- Calculate the maximum allowed used_days
    select entitled_days + carried_over into v_max
      from public.leave_balances
     where employee_id = new.employee_id
       and year = v_year
       and leave_type = new.leave_type;

    if v_max is not null then
      update public.leave_balances
         set used_days = least(used_days + new.days_count, v_max)
       where employee_id = new.employee_id
         and year = v_year
         and leave_type = new.leave_type;
    end if;
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
