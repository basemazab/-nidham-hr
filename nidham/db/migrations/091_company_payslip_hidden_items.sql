set client_encoding to 'UTF8';

-- Per-company control over which optional payslip / period-report line-items
-- are shown. Empty array (default) = show everything. The accountant export
-- is never affected — it always carries every column.
alter table public.companies
  add column if not exists payslip_hidden_items text[] not null default '{}';

comment on column public.companies.payslip_hidden_items is
  'قائمة بنود قسيمة الراتب المخفية (مثل social_insurance, income_tax). فاضي = إظهار الكل. لا يؤثر على ملف المحاسب.';

notify pgrst, 'reload schema';
