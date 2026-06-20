set client_encoding to 'UTF8';

-- ============================================================================
-- 114 — Company logo for document branding
-- ============================================================================
-- Stores the tenant's logo as a base64 data URL directly on the companies row,
-- so generated documents (memos, official PDFs) embed it with ZERO external
-- storage/CDN dependency — it travels with the print window and never needs a
-- network fetch. The image is downscaled client-side before upload, so the
-- column stays small. Existing queries select explicit columns, so adding this
-- never bloats them; only the branding settings page and the document
-- generators read it.

alter table public.companies
  add column if not exists logo_url text;
