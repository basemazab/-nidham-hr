set client_encoding to 'UTF8';

-- ============================================================================
-- 115 — Private storage bucket for uploaded application CVs
-- ============================================================================
-- Stores the ORIGINAL CV file (PDF/Word) a candidate uploads, so HR can
-- download it — not just read the AI-parsed text. Private bucket: uploads and
-- downloads go through the service-role client (signed URLs), so no public
-- exposure of candidate PII and no extra RLS policies are required.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'application-cvs',
  'application-cvs',
  false,
  10485760, -- 10 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;
