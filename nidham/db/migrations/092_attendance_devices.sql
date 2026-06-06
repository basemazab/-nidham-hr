set client_encoding to 'UTF8';

-- ============================================================================
-- 092 — Biometric device registry (ZKTeco ADMS / Cloud-push)
-- ============================================================================
-- A registered fingerprint device PUSHES punches to our /iclock endpoint
-- (ZKTeco "Cloud Server Setup" / ADMS protocol). The endpoint authenticates a
-- push by matching the device Serial Number (SN) to a row here, resolves the
-- company, maps the punch PIN -> employee, and upserts into `attendance` with
-- an import_batch_id so the records flow into the existing review/approve page.

create table if not exists public.attendance_devices (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid not null references public.companies(id) on delete cascade,
  name            text not null,                       -- e.g. "بصمة المصنع - البوابة"
  serial_number   text not null,                       -- device SN (from the device menu)
  device_type     text not null default 'zkteco',
  is_active       boolean not null default true,       -- gate: only active devices are accepted
  last_seen_at    timestamptz,                         -- any contact (handshake/poll)
  last_push_at    timestamptz,                         -- last ATTLOG push that carried punches
  total_punches   integer not null default 0,          -- lifetime punches accepted
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  -- One physical device = one company. SN is globally unique so the ingest
  -- endpoint can resolve company from SN alone (the device sends no auth).
  unique (serial_number)
);

create index if not exists idx_att_devices_company on public.attendance_devices(company_id);
create index if not exists idx_att_devices_serial  on public.attendance_devices(serial_number);

alter table public.attendance_devices enable row level security;

-- Company members manage their own devices. The ingest endpoint uses the
-- service-role client (bypasses RLS) because the device is not an auth user.
drop policy if exists att_devices_select on public.attendance_devices;
create policy att_devices_select on public.attendance_devices
  for select using (company_id = public.current_company_id());

drop policy if exists att_devices_write on public.attendance_devices;
create policy att_devices_write on public.attendance_devices
  for all using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

comment on table public.attendance_devices is
  'أجهزة البصمة المسجّلة (ZKTeco ADMS/Cloud-push). الـendpoint بيطابق الـSerial Number عشان يعرف الشركة.';

-- Atomic lifetime punch counter, called by the /iclock ingest route.
create or replace function public.increment_device_punches(
  p_device_id uuid,
  p_count integer
) returns void
language sql
security definer
set search_path = public
as $$
  update public.attendance_devices
     set total_punches = total_punches + greatest(coalesce(p_count, 0), 0)
   where id = p_device_id;
$$;

notify pgrst, 'reload schema';
