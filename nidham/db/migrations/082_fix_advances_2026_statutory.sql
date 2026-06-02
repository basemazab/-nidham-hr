-- ============================================================================
-- Migration 082 — Fix advances accrued-net calculator to 2026 statutory rates
-- ============================================================================
-- compute_employee_accrued_net (defined in migration 027) drives the Wednesday
-- advances roster: how much net pay an employee has accrued, and therefore how
-- large an advance they can take. It still used the STALE 2024 figures:
--   • social insurance 14% (now 11%), ceiling 12,600 (now 16,700), no floor
--   • income-tax ladder starting at 10% on the first 40k (now a 0% bracket)
-- so advance eligibility was computed wrong for every company with SI/tax on.
--
-- This migration extracts the statutory math into two canonical, reusable
-- helper functions that mirror src/lib/payroll.ts EXACTLY (the 2026 NOSI decree
-- + Law 175/2023 brackets), then re-creates the accrued-net function to call
-- them. The function signature and output columns are unchanged.
-- ============================================================================

SET client_encoding TO 'UTF8';

-- ----------------------------------------------------------------------------
-- Helper 1 — Employee social-insurance share, 2026 (NOSI decree).
-- 11% of the insurable wage = the gross clamped between the monthly floor
-- (2,700) and ceiling (16,700). Mirrors calculateSocialInsurance() in
-- src/lib/payroll.ts. `p_proration` (0..1) scales the floor + ceiling for a
-- partial cycle (the accrued-net calculator passes effective/working days);
-- callers wanting a full month pass 1.
-- ----------------------------------------------------------------------------
create or replace function public.nidham_social_insurance_2026(
  p_gross numeric,
  p_proration numeric default 1
) returns numeric
language sql
immutable
as $$
  select case
    when p_gross is null or p_gross <= 0 then 0
    else round(
      least(
        16700 * coalesce(p_proration, 1),
        greatest(p_gross, 2700 * coalesce(p_proration, 1))
      ) * 0.11,
      2
    )
  end;
$$;

-- ----------------------------------------------------------------------------
-- Helper 2 — Egyptian personal income tax, 2026 brackets (Law 175/2023).
-- Takes ANNUAL taxable income AFTER the 20,000 personal exemption and returns
-- the ANNUAL tax. Mirrors TAX_BRACKETS_2026 / calculateAnnualIncomeTax() in
-- src/lib/payroll.ts: 0–40k 0%, 40–55k 10%, 55–70k 15%, 70–200k 20%,
-- 200–400k 22.5%, 400k–1.2M 25%, >1.2M 27.5%.
-- ----------------------------------------------------------------------------
create or replace function public.nidham_income_tax_annual_2026(
  p_taxable_annual numeric
) returns numeric
language sql
immutable
as $$
  select case
    when p_taxable_annual is null or p_taxable_annual <= 40000 then 0
    when p_taxable_annual <= 55000 then (p_taxable_annual - 40000) * 0.10
    when p_taxable_annual <= 70000 then 15000 * 0.10 + (p_taxable_annual - 55000) * 0.15
    when p_taxable_annual <= 200000 then 15000 * 0.10 + 15000 * 0.15 + (p_taxable_annual - 70000) * 0.20
    when p_taxable_annual <= 400000 then 15000 * 0.10 + 15000 * 0.15 + 130000 * 0.20 + (p_taxable_annual - 200000) * 0.225
    when p_taxable_annual <= 1200000 then 15000 * 0.10 + 15000 * 0.15 + 130000 * 0.20 + 200000 * 0.225 + (p_taxable_annual - 400000) * 0.25
    else 15000 * 0.10 + 15000 * 0.15 + 130000 * 0.20 + 200000 * 0.225 + 800000 * 0.25 + (p_taxable_annual - 1200000) * 0.275
  end;
$$;

grant execute on function public.nidham_social_insurance_2026(numeric, numeric) to authenticated;
grant execute on function public.nidham_income_tax_annual_2026(numeric) to authenticated;

-- ----------------------------------------------------------------------------
-- Re-create compute_employee_accrued_net to use the 2026 helpers. Body is
-- identical to migration 027 except the SI + tax blocks now call the helpers
-- above (and a dead empty loop is gone). Signature + output columns unchanged.
-- ----------------------------------------------------------------------------
create or replace function public.compute_employee_accrued_net(
  p_employee_id uuid,
  p_as_of_date  date default current_date
) returns table (
  full_name              text,
  monthly_base           numeric,
  working_days           integer,
  daily_rate             numeric,
  attended_days          integer,
  half_day_days          integer,
  leave_days             integer,
  absent_days            integer,
  effective_days         numeric,
  accrued_gross          numeric,
  social_insurance       numeric,
  income_tax             numeric,
  accrued_net            numeric,
  existing_open_advances numeric,
  available_headroom     numeric,
  eligible_50pct         numeric,
  eligible_70pct         numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_emp record;
  v_company record;
  v_cycle record;
  v_cycle_start date;
  v_cycle_end date;
  v_working_days int := 26;
  v_daily_rate numeric := 0;
  v_monthly_base numeric := 0;
  v_attended int := 0;
  v_half int := 0;
  v_leave int := 0;
  v_absent int := 0;
  v_effective numeric := 0;
  v_gross numeric := 0;
  v_insurance numeric := 0;
  v_tax numeric := 0;
  v_net numeric := 0;
  v_open numeric := 0;
  v_headroom numeric := 0;
  v_taxable_annual numeric := 0;
  v_annual_tax numeric := 0;
begin
  -- 1. Employee snapshot
  select
    e.full_name,
    coalesce(e.basic_salary, 0) as basic_salary,
    coalesce(e.housing_allowance, 0) as housing_allowance,
    coalesce(e.transport_allowance, 0) as transport_allowance,
    coalesce(e.other_allowances, 0) as other_allowances,
    coalesce(e.incentive_allowance, 0) as incentive_allowance,
    e.company_id
  into v_emp
  from public.employees e
  where e.id = p_employee_id;

  if v_emp.full_name is null then
    return;
  end if;

  -- Tenant guard (security-definer re-check).
  if v_emp.company_id <> public.current_company_id() then
    return;
  end if;

  select
    coalesce(c.social_insurance_enabled, false) as social_insurance_enabled,
    coalesce(c.income_tax_enabled, false) as income_tax_enabled
  into v_company
  from public.companies c
  where c.id = v_emp.company_id;

  -- 2. Salary structure
  v_monthly_base :=
    v_emp.basic_salary +
    v_emp.housing_allowance +
    v_emp.transport_allowance +
    v_emp.other_allowances +
    v_emp.incentive_allowance;

  -- 3. Resolve the company's cycle window containing as_of_date.
  -- Falls back to calendar month if the company hasn't configured a
  -- custom start_day yet (compute_payroll_cycle_window defaults to 1).
  select cs.cycle_start, cs.cycle_end
    into v_cycle
  from public.compute_payroll_cycle_window(p_as_of_date, 'monthly') cs
  limit 1;

  if v_cycle.cycle_start is null then
    -- safety net: should never happen with the default args, but if it
    -- does, fall back to calendar month so we don't divide by zero.
    v_cycle_start := date_trunc('month', p_as_of_date)::date;
    v_cycle_end := (date_trunc('month', p_as_of_date) + interval '1 month' - interval '1 day')::date;
  else
    v_cycle_start := v_cycle.cycle_start;
    v_cycle_end := v_cycle.cycle_end;
  end if;

  -- Working days in the cycle = (end - start + 1) - weekly rest days
  -- approximation. For a 21->20 cycle that's exactly 30 days; we keep
  -- 26 as the "working days" default since the Egyptian SMB convention
  -- treats one rest day per week (Friday). HR overrides this in the
  -- payroll period if their workweek differs.
  v_working_days := 26;

  v_daily_rate := case
    when v_working_days > 0 then v_monthly_base / v_working_days
    else 0
  end;

  -- 4. Attendance from cycle_start to as_of_date
  select
    count(*) filter (where status = 'present'),
    count(*) filter (where status = 'half_day'),
    count(*) filter (where status in ('leave', 'holiday', 'weekend')),
    count(*) filter (where status = 'absent')
  into v_attended, v_half, v_leave, v_absent
  from public.attendance
  where employee_id = p_employee_id
    and date >= v_cycle_start
    and date <= p_as_of_date;

  v_effective := v_attended + (v_half::numeric * 0.5) + v_leave;
  v_gross := round(v_effective * v_daily_rate, 2);

  -- 5. Pro-rated statutory deductions for 2026, shared with the TS payroll
  -- engine via the canonical helper functions defined above.
  if v_company.social_insurance_enabled then
    v_insurance := public.nidham_social_insurance_2026(
      v_gross,
      case when v_working_days > 0 then v_effective / v_working_days else 0 end
    );
  end if;

  if v_company.income_tax_enabled then
    v_taxable_annual := greatest(0, (v_gross - v_insurance) * 12 - 20000);
    v_annual_tax := public.nidham_income_tax_annual_2026(v_taxable_annual);
    v_tax := round(v_annual_tax / 12, 2);
  end if;

  v_net := round(v_gross - v_insurance - v_tax, 2);
  if v_net < 0 then v_net := 0; end if;

  -- 6. Existing open advances: count installments already deducted via
  -- payroll periods that start strictly after the advance's paid_at.
  -- Uses pp.start_date instead of (year*100+month).
  with open_advances as (
    select
      ar.id,
      ar.amount,
      ar.installments,
      ar.paid_at::date as paid_date,
      (
        select count(*)
        from public.payroll_periods pp
        join public.payroll_entries pe on pe.period_id = pp.id
        where pe.employee_id = p_employee_id
          and pp.status in ('approved', 'paid')
          and pp.start_date > ar.paid_at::date
      ) as months_repaid
    from public.advance_requests ar
    where ar.employee_id = p_employee_id
      and ar.status = 'paid'
      and ar.paid_at is not null
  )
  select coalesce(sum(
    greatest(
      0,
      amount - round(amount / installments, 2) * least(months_repaid, installments)
    )
  ), 0)
  into v_open
  from open_advances;

  v_headroom := greatest(0, v_net - v_open);

  return query
  select
    v_emp.full_name,
    v_monthly_base,
    v_working_days,
    round(v_daily_rate, 2),
    v_attended,
    v_half,
    v_leave,
    v_absent,
    v_effective,
    v_gross,
    v_insurance,
    v_tax,
    v_net,
    v_open,
    v_headroom,
    round(v_headroom * 0.50, 2),
    round(v_headroom * 0.70, 2);
end;
$$;

grant execute on function public.compute_employee_accrued_net(uuid, date) to authenticated;

notify pgrst, 'reload schema';
