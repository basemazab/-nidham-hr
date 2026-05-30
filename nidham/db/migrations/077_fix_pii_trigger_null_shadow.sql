-- ============================================================================
-- Migration 077 — Fix PII trigger: clear shadow column when value is deleted
-- ============================================================================
--
-- BUG
-- ===
-- When HR clears a PII field (e.g. national_id, bank_account_number) in the
-- employee form, the `updateEmployee()` server action sends null to the
-- `employees` table. The BEFORE UPDATE trigger correctly detects the change
-- but ONLY encrypts when the new value IS NOT NULL — it never clears the
-- corresponding `*_encrypted` shadow column. The old encrypted value persists,
-- so the `employees_with_pii` view decrypts it on the next page load, making
-- it look like the deletion failed.
--
-- FIX
-- ===
-- Add ELSE branches to each PII block: when the new value is explicitly set
-- to NULL (meaning HR deliberately cleared it), also null out the shadow
-- column.
--
-- Migration 077 (this file) — idempotent via CREATE OR REPLACE.
-- ============================================================================

create or replace function public.tg_encrypt_employee_pii()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if (tg_op = 'INSERT' or new.national_id is distinct from coalesce(old.national_id, null)) then
    if new.national_id is not null then
      new.national_id_encrypted := pii_encrypt(new.national_id);
      new.national_id := null;
    else
      new.national_id_encrypted := null;
    end if;
  end if;

  if (tg_op = 'INSERT' or new.bank_account_number is distinct from coalesce(old.bank_account_number, null)) then
    if new.bank_account_number is not null then
      new.bank_account_number_encrypted := pii_encrypt(new.bank_account_number);
      new.bank_account_number := null;
    else
      new.bank_account_number_encrypted := null;
    end if;
  end if;

  if (tg_op = 'INSERT' or new.bank_name is distinct from coalesce(old.bank_name, null)) then
    if new.bank_name is not null then
      new.bank_name_encrypted := pii_encrypt(new.bank_name);
      new.bank_name := null;
    else
      new.bank_name_encrypted := null;
    end if;
  end if;

  if (tg_op = 'INSERT' or new.social_insurance_number is distinct from coalesce(old.social_insurance_number, null)) then
    if new.social_insurance_number is not null then
      new.social_insurance_number_encrypted := pii_encrypt(new.social_insurance_number);
      new.social_insurance_number := null;
    else
      new.social_insurance_number_encrypted := null;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.tg_encrypt_employee_pii() is
  'BEFORE-trigger that moves plaintext PII into *_encrypted shadow columns. Clears shadow column when value is set to NULL (migration 077 fix).';

drop trigger if exists employees_encrypt_pii on public.employees;
create trigger employees_encrypt_pii
  before insert or update of national_id, bank_account_number, bank_name, social_insurance_number
  on public.employees
  for each row execute function public.tg_encrypt_employee_pii();
