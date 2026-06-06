-- ============================================================================
-- Migration 090 — Explicit per-employee daily wage (قيمة اليوم)
-- ============================================================================
-- Absence + tardiness deductions derive the day value from salary ÷ working
-- days. When the cycle's working-days divisor is off (common for weekly staff
-- or odd months), the deducted absence value comes out wrong. This optional
-- column lets HR pin the exact daily wage for an employee; payroll uses it
-- directly when set, and falls back to salary ÷ working-days when NULL.
-- ============================================================================

set client_encoding to 'UTF8';

alter table public.employees
  add column if not exists daily_wage numeric(10, 2);

comment on column public.employees.daily_wage is
  'قيمة اليوم — explicit daily wage (EGP) used for absence/tardiness deductions. NULL = derive from salary ÷ working days.';

notify pgrst, 'reload schema';
