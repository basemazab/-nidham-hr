-- ============================================================================
-- Migration 081 — Company contact WhatsApp for job ads
-- Lets each company set a WhatsApp number that appears on their public job
-- postings so candidates can contact the company directly instead of Nidham.
-- ============================================================================

alter table public.companies
  add column contact_whatsapp text;

-- Anon visitors need read access to contact_whatsapp on public job pages.
-- The existing companies RLS policy already allows SELECT for all rows the
-- user can see (public_jobs view exposes company_id), so anon access to the
-- public_jobs view's company is already implicitly granted via the existing
-- "companies select" policy that allows authenticated and anon users.
