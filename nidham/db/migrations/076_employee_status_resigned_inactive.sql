-- 076: Add resigned and inactive employee statuses
-- Allows HR to mark employees as resigned or inactive without going through the full termination flow.

alter table public.employees
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_status_check
  check (status in ('active', 'on_leave', 'terminated', 'resigned', 'inactive'));
