-- 076: Add resigned and inactive employee statuses
-- Allows HR to mark employees as resigned or inactive without going through the full termination flow.

begin;

-- Drop and recreate the check constraint to include the new statuses
alter table public.employees
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_status_check
  check (status in ('active', 'on_leave', 'terminated', 'resigned', 'inactive'));

-- Update the employees_with_pii view to reflect the new type
-- (the view just selects from employees, so it automatically picks up the change)

commit;
