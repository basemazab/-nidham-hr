-- ============================================================================
-- Migration 080 — Make CV optional in public job applications
--
-- Removes the requirement that p_cv_text must be >= 30 chars or p_cv_pdf_url
-- must be set. Applicants can now submit without uploading a CV.
-- ============================================================================

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
begin
  p_full_name := nullif(trim(p_full_name), '');
  p_email     := nullif(trim(p_email), '');

  if p_full_name is null then
    raise exception 'الاسم مطلوب' using errcode = 'P0001';
  end if;
  if p_email is null then
    raise exception 'الإيميل مطلوب' using errcode = 'P0001';
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
