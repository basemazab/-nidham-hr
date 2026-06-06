-- ============================================================================
-- Migration 082 — 2026 statutory rates + advance calculator helpers
--
-- 1. Stores the 2026 social insurance & income tax parameters so the
--    payroll engine can read them from the DB (not just TypeScript).
-- 2. Adds get_statutory_rates() for use by DB functions, payslip views, etc.
-- 3. Enhances compute_advance_deduction_for_period with an optional
--    p_max_days parameter so HR can cap advances (e.g. 50% of net).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Statutory rates table (one row per year)
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.statutory_rates (
  year                      integer primary key,
  si_employee_rate          numeric(5,4) not null default 0.1100,  -- 11%
  si_employer_rate          numeric(5,4) not null default 0.1875,  -- 18.75%
  si_min_insurable_wage     numeric(10,2) not null default 2700,
  si_max_insurable_wage     numeric(10,2) not null default 16700,
  si_health_insurance_rate  numeric(5,4) not null default 0.0150,  -- 1.5%
  income_tax_exemption      numeric(10,2) not null default 20000,  -- 20k/yr personal
  valid_from                date not null default '2026-01-01',
  created_at                timestamptz not null default now()
);

comment on table public.statutory_rates is 'معدلات قانونية سنوية (تأمينات + ضريبة)';

-- Seed 2026
insert into public.statutory_rates (year) values (2026)
on conflict (year) do nothing;

-- RLS: authenticated can read, only admins can write
alter table public.statutory_rates enable row level security;

drop policy if exists "any_auth_can_read_statutory_rates" on public.statutory_rates;
create policy "any_auth_can_read_statutory_rates"
  on public.statutory_rates for select
  using (true);

drop policy if exists "admin_can_write_statutory_rates" on public.statutory_rates;
create policy "admin_can_write_statutory_rates"
  on public.statutory_rates for all
  using (coalesce(current_setting('request.jwt.claims', true)::json->>'role', '') = 'admin');

grant select on public.statutory_rates to authenticated, anon;
grant insert, update, delete on public.statutory_rates to authenticated;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Helper function: return the statutory rates for a given year
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.get_statutory_rates(p_year integer default 2026)
returns table (
  year integer,
  si_employee_rate numeric,
  si_employer_rate numeric,
  si_min_insurable_wage numeric,
  si_max_insurable_wage numeric,
  si_health_insurance_rate numeric,
  income_tax_exemption numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select year, si_employee_rate, si_employer_rate, si_min_insurable_wage,
         si_max_insurable_wage, si_health_insurance_rate, income_tax_exemption
    from public.statutory_rates
   where year = p_year
   union all
  select 2026, 0.1100, 0.1875, 2700, 16700, 0.0150, 20000
   where not exists (select 1 from public.statutory_rates where year = p_year)
   limit 1;
$$;

grant execute on function public.get_statutory_rates(integer) to authenticated, anon;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Update compute_advance_deduction_for_period with a p_max_days cap
--    (optional — backport the original signature with a default so existing
--     callers keep working)
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.compute_advance_deduction_for_period(
  p_employee_id    uuid,
  p_period_start   date,
  p_period_end     date,
  p_max_days       integer default null  -- optional cap on deduction days
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_company_id         uuid;
  v_loan_total         numeric;
  v_installments       numeric;
  v_daily_rate         numeric;
  v_cycle_days         integer;
  v_deduction          numeric;
  v_remaining          numeric;
  v_loan_count         integer;
begin
  -- Get the employee's company
  select company_id into v_company_id
    from public.employees
   where id = p_employee_id;

  if v_company_id is null then
    return 0;
  end if;

  -- Sum of outstanding loan amounts for this employee (approved loans)
  select coalesce(sum(amount), 0), count(*)
    into v_loan_total, v_loan_count
    from public.employee_loans
   where employee_id = p_employee_id
     and status = 'approved'
     and paid_amount < amount;

  if v_loan_count = 0 then
    return 0;
  end if;

  -- Determine the period's working days
  select coalesce(working_days, 26) into v_cycle_days
    from public.payroll_periods
   where company_id = v_company_id
     and start_date = p_period_start
     and end_date = p_period_end
   limit 1;

  if v_cycle_days is null then
    v_cycle_days := 26;
  end if;

  -- Cap by p_max_days if provided
  if p_max_days is not null and p_max_days > 0 then
    v_cycle_days := least(v_cycle_days, p_max_days);
  end if;

  -- Calculate deduction based on remaining loan and cycle days
  v_remaining := v_loan_total - coalesce(
    (select sum(paid_amount) from public.employee_loans
      where employee_id = p_employee_id and status = 'approved'), 0
  );

  if v_remaining <= 0 then
    return 0;
  end if;

  -- The existing formula: spread remaining over 3 cycles, capped at daily_rate * cycle_days
  select coalesce(basic_salary, 0) / 30.0 into v_daily_rate
    from public.employees
   where id = p_employee_id;

  if v_daily_rate <= 0 then
    return 0;
  end if;

  v_deduction := least(
    v_remaining / 3.0,
    v_daily_rate * v_cycle_days * 0.5  -- max 50% of daily pay
  );

  return round(v_deduction, 2);
end;
$$;

grant execute on function public.compute_advance_deduction_for_period(uuid, date, date, integer) to authenticated;
