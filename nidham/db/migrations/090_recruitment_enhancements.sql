-- ============================================================================
-- Migration 090 — Recruitment enhancements (pipeline stages, skills, history)
--
-- Extends the existing 012-013 schema with:
--   1. Job skills table      (per-job required/nice-to-have skills)
--   2. Pipeline stages table  (customizable per-job stages)
--   3. Stage history table    (audit trail for applicant stage changes)
--   4. Extra columns on existing tables (benefits, level, counters, etc.)
-- ============================================================================

set client_encoding to 'UTF8';

-- 1. Extra columns on jobs ----------------------------------------------------
alter table public.jobs
  add column if not exists benefits              text,
  add column if not exists level                 text default 'mid'
    check (level in ('intern','entry','mid','senior','lead','manager','dir')),
  add column if not exists is_salary_visible     boolean default true,
  add column if not exists views_count           integer default 0,
  add column if not exists applications_count    integer default 0;

-- 2. Extra columns on candidates ----------------------------------------------
alter table public.candidates
  add column if not exists user_id       uuid references auth.users(id) on delete set null,
  add column if not exists headline      text,
  add column if not exists summary       text,
  add column if not exists avatar        text,
  add column if not exists skills        text[];

-- 3. Extra columns on applications --------------------------------------------
alter table public.applications
  add column if not exists assigned_to        uuid references auth.users(id) on delete set null,
  add column if not exists rating             integer check (rating between 1 and 5),
  add column if not exists last_activity_at   timestamptz default now(),
  add column if not exists ai_match_details   jsonb;

create index if not exists idx_applications_assigned
  on public.applications(assigned_to) where assigned_to is not null;

-- 4. Job skills table ---------------------------------------------------------
create table if not exists public.job_skills (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs(id) on delete cascade,
  name        text not null,
  is_required boolean default true,
  unique (job_id, name)
);

create index if not exists idx_job_skills_job on public.job_skills(job_id);

-- 5. Pipeline stages (custom per-job) -----------------------------------------
create table if not exists public.pipeline_stages (
  id      uuid primary key default gen_random_uuid(),
  job_id  uuid not null references public.jobs(id) on delete cascade,
  name    text not null,
  ordinal int  not null default 0,
  color   text not null default '#3b82f6'
);

create index if not exists idx_pipeline_stages_job on public.pipeline_stages(job_id);

-- 6. Stage history (track applicant movement through pipeline) -----------------
create table if not exists public.stage_history (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  from_stage      text,
  to_stage        text not null,
  changed_by      uuid references auth.users(id) on delete set null,
  notes           text,
  created_at      timestamptz default now() not null
);

create index if not exists idx_stage_history_app on public.stage_history(application_id);

-- 7. RLS policies for new tables ----------------------------------------------
alter table public.job_skills      enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.stage_history   enable row level security;

-- Job skills: tenant-scoped via job's company_id
create policy job_skills_tenant_select
  on public.job_skills for select
  using (exists (
    select 1 from public.jobs
    where jobs.id = job_skills.job_id
      and jobs.company_id = public.current_company_id()
  ));

create policy job_skills_tenant_insert
  on public.job_skills for insert
  with check (exists (
    select 1 from public.jobs
    where jobs.id = job_skills.job_id
      and jobs.company_id = public.current_company_id()
  ));

create policy job_skills_tenant_update
  on public.job_skills for update
  using (exists (
    select 1 from public.jobs
    where jobs.id = job_skills.job_id
      and jobs.company_id = public.current_company_id()
  ));

create policy job_skills_tenant_delete
  on public.job_skills for delete
  using (exists (
    select 1 from public.jobs
    where jobs.id = job_skills.job_id
      and jobs.company_id = public.current_company_id()
  ));

-- Pipeline stages: tenant-scoped via job's company_id
create policy pipeline_stages_tenant_select
  on public.pipeline_stages for select
  using (exists (
    select 1 from public.jobs
    where jobs.id = pipeline_stages.job_id
      and jobs.company_id = public.current_company_id()
  ));

create policy pipeline_stages_tenant_insert
  on public.pipeline_stages for insert
  with check (exists (
    select 1 from public.jobs
    where jobs.id = pipeline_stages.job_id
      and jobs.company_id = public.current_company_id()
  ));

create policy pipeline_stages_tenant_update
  on public.pipeline_stages for update
  using (exists (
    select 1 from public.jobs
    where jobs.id = pipeline_stages.job_id
      and jobs.company_id = public.current_company_id()
  ));

create policy pipeline_stages_tenant_delete
  on public.pipeline_stages for delete
  using (exists (
    select 1 from public.jobs
    where jobs.id = pipeline_stages.job_id
      and jobs.company_id = public.current_company_id()
  ));

-- Stage history: tenant-scoped via application's company_id
create policy stage_history_tenant_select
  on public.stage_history for select
  using (exists (
    select 1 from public.applications
    where applications.id = stage_history.application_id
      and applications.company_id = public.current_company_id()
  ));

create policy stage_history_tenant_insert
  on public.stage_history for insert
  with check (exists (
    select 1 from public.applications
    where applications.id = stage_history.application_id
      and applications.company_id = public.current_company_id()
  ));

-- 8. Update public_jobs view to include new columns ---------------------------
drop view if exists public.public_jobs;
create view public.public_jobs as
select
  id, company_id, title, department, description,
  requirements, responsibilities, benefits,
  job_type, level, location, remote_ok,
  salary_min, salary_max, is_salary_visible,
  experience_years_min, slug, posted_at, closes_at
from public.jobs
where is_public = true
  and status = 'open';

grant select on public.public_jobs to anon, authenticated;

notify pgrst, 'reload schema';
