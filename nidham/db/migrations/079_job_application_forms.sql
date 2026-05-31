-- ============================================================================
-- Migration 079 — Job application forms + custom questions
--
-- Adds support for:
--   1. Per-job custom application form (AI-generated + manually edited
--      questions stored as JSONB in jobs.application_form).
--   2. Applicant answers to those questions (applications.answers).
--   3. show_salary toggle so salary can be hidden on the public page.
-- ============================================================================

-- 0. Drop functions that changed signature -----------------------------------
drop function if exists public.fetch_application_for_screening(uuid);
drop function if exists public.submit_public_application(
  text, text, text, text, text, text, numeric, text, text, text
);

-- 1. Jobs: add application_form + show_salary ---------------------------------
alter table public.jobs
  add column if not exists application_form jsonb default '[]'::jsonb,
  add column if not exists show_salary      boolean default false;

comment on column public.jobs.application_form is
  'Array of question objects: {id, type, label, required, options?}';
comment on column public.jobs.show_salary is
  'If false, salary is hidden from the public job page';

-- 2. Applications: add answers JSONB ------------------------------------------
alter table public.applications
  add column if not exists answers jsonb default '{}'::jsonb;

comment on column public.applications.answers is
  'Map of question_id → answer value';

-- 3. Expose the new columns in the public_jobs view ---------------------------
create or replace view public.public_jobs as
select
  id,
  company_id,
  title,
  department,
  description,
  requirements,
  responsibilities,
  job_type,
  location,
  remote_ok,
  salary_min,
  salary_max,
  experience_years_min,
  slug,
  posted_at,
  closes_at,
  application_form
from public.jobs
where is_public = true
  and status = 'open';

-- 4. Update the public application RPC to accept answers ----------------------
create or replace function public.submit_public_application(
  p_job_slug      text,
  p_full_name     text,
  p_email         text,
  p_phone         text default null,
  p_current_title text default null,
  p_location      text default null,
  p_years_experience numeric default null,
  p_cv_text       text default null,
  p_cv_pdf_url    text default null,
  p_cover_letter  text default null,
  p_answers       jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id        uuid;
  v_company_id    uuid;
  v_candidate_id  uuid;
  v_app_id        uuid;
  v_cv_chars      integer;
begin
  p_full_name := nullif(trim(p_full_name), '');
  p_email     := nullif(trim(p_email), '');
  p_cv_text   := nullif(p_cv_text, '');

  if p_full_name is null then
    raise exception 'الاسم مطلوب' using errcode = 'P0001';
  end if;
  if p_email is null then
    raise exception 'الإيميل مطلوب' using errcode = 'P0001';
  end if;

  v_cv_chars := coalesce(length(p_cv_text), 0);
  if v_cv_chars < 30 and p_cv_pdf_url is null then
    raise exception 'لازم ترفع CV أو تلصق نص السيرة الذاتية' using errcode = 'P0001';
  end if;

  select id, company_id into v_job_id, v_company_id
  from public.jobs
  where slug = p_job_slug
    and is_public = true
    and status = 'open'
  limit 1;

  if v_job_id is null then
    raise exception 'الوظيفة دي مش متاحة أو اتقفلت' using errcode = 'P0001';
  end if;

  select id into v_candidate_id
  from public.candidates
  where company_id = v_company_id and email = p_email
  limit 1;

  if v_candidate_id is null then
    insert into public.candidates (
      company_id, full_name, email, phone, current_title, location, years_experience
    )
    values (
      v_company_id, p_full_name, p_email, p_phone, p_current_title, p_location, p_years_experience
    )
    returning id into v_candidate_id;
  else
    update public.candidates set
      full_name        = coalesce(p_full_name, full_name),
      phone            = coalesce(p_phone, phone),
      current_title    = coalesce(p_current_title, current_title),
      location         = coalesce(p_location, location),
      years_experience = coalesce(p_years_experience, years_experience),
      updated_at       = now()
    where id = v_candidate_id;
  end if;

  if exists (
    select 1 from public.applications
    where job_id = v_job_id and candidate_id = v_candidate_id
  ) then
    raise exception 'انت قدمت قبل كده على نفس الوظيفة' using errcode = 'P0001';
  end if;

  insert into public.applications (
    company_id, job_id, candidate_id,
    cv_text, cv_pdf_url, cover_letter,
    source, status, answers
  )
  values (
    v_company_id, v_job_id, v_candidate_id,
    p_cv_text, p_cv_pdf_url, p_cover_letter,
    'public_portal', 'new', p_answers
  )
  returning id into v_app_id;

  return v_app_id;
end;
$$;

grant execute on function public.submit_public_application(
  text, text, text, text, text, text, numeric, text, text, text, jsonb
) to anon, authenticated;

-- 5. Update the screening fetch RPC to include answers ------------------------
create or replace function public.fetch_application_for_screening(p_app_id uuid)
returns table (
  cv_text text,
  job_title text,
  job_department text,
  job_description text,
  job_requirements text,
  job_responsibilities text,
  job_experience_years_min integer,
  job_location text,
  job_type text,
  candidate_full_name text,
  candidate_current_title text,
  candidate_years_experience numeric,
  candidate_location text,
  application_answers jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    a.cv_text,
    j.title,
    j.department,
    j.description,
    j.requirements,
    j.responsibilities,
    j.experience_years_min,
    j.location,
    j.job_type,
    c.full_name,
    c.current_title,
    c.years_experience,
    c.location,
    a.answers
  from public.applications a
  join public.jobs j on j.id = a.job_id
  join public.candidates c on c.id = a.candidate_id
  where a.id = p_app_id
    and a.source = 'public_portal'
    and a.ai_analyzed_at is null;
$$;

grant execute on function public.fetch_application_for_screening(uuid) to anon, authenticated;
