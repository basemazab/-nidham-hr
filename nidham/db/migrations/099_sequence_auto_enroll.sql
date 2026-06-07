set client_encoding to 'UTF8';

-- ============================================================================
-- 099 — Auto-enroll new conversations into a welcome sequence
-- ============================================================================
-- Flag a sequence so EVERY new Messenger/Instagram conversation is enrolled in
-- it automatically on first contact (the classic "welcome drip"). The webhook
-- enrolls on conversation creation (best-effort); /api/cron/run-sequences then
-- sends the steps. Only one auto-enroll sequence should be active per company
-- in practice, but the webhook enrolls into all active auto-enroll sequences.

alter table public.marketing_sequences
  add column if not exists auto_enroll boolean not null default false;

create index if not exists idx_sequences_auto_enroll
  on public.marketing_sequences(company_id, active, auto_enroll);

notify pgrst, 'reload schema';
