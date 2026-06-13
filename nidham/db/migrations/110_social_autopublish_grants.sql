set client_encoding to 'UTF8';

-- ============================================================================
-- 110 — auto-publish grants for the social scheduler cron
-- ============================================================================
-- The publish helpers (decrypt_social_token, record_target_publish_result)
-- were granted to `authenticated` only — fine for the manual composer, but
-- the new daily cron runs as the SERVICE ROLE and would hit "permission
-- denied". Grant execute to service_role so scheduled social posts publish
-- automatically without a logged-in admin.

grant execute on function public.decrypt_social_token(uuid, text) to service_role;
grant execute on function public.record_target_publish_result(uuid, text, text, text, text) to service_role;
