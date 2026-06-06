"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { arabicizeDbError } from "@/lib/i18n";

const BASE = "/dashboard/settings/devices";

// Register a biometric device by name + serial number. The serial is what the
// /iclock ingest endpoint uses to authenticate pushes, so it must match the SN
// shown in the device's menu exactly.
export async function registerDevice(formData: FormData) {
  const { supabase, profile } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const serial = String(formData.get("serial_number") ?? "").trim();

  if (name.length < 2) {
    redirect(`${BASE}?error=${encodeURIComponent("اكتب اسم للجهاز")}`);
  }
  if (serial.length < 3) {
    redirect(`${BASE}?error=${encodeURIComponent("اكتب الرقم التسلسلي (Serial) للجهاز")}`);
  }

  const { error } = await supabase.from("attendance_devices").insert({
    company_id: profile.company_id,
    name,
    serial_number: serial,
    device_type: "zkteco",
    is_active: true,
  });

  if (error) {
    const msg =
      error.code === "23505"
        ? "الرقم التسلسلي ده مسجّل بالفعل (لنفس الشركة أو لشركة تانية)."
        : arabicizeDbError(error.message);
    redirect(`${BASE}?error=${encodeURIComponent(msg)}`);
  }

  revalidatePath(BASE);
  redirect(`${BASE}?saved=1`);
}

export async function toggleDevice(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const makeActive = String(formData.get("active") ?? "") === "1";
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect(BASE);

  await supabase
    .from("attendance_devices")
    .update({ is_active: makeActive })
    .eq("id", id)
    .eq("company_id", profile.company_id);

  revalidatePath(BASE);
  redirect(BASE);
}

export async function deleteDevice(formData: FormData) {
  const { supabase, profile } = await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect(BASE);

  await supabase
    .from("attendance_devices")
    .delete()
    .eq("id", id)
    .eq("company_id", profile.company_id);

  revalidatePath(BASE);
  redirect(`${BASE}?deleted=1`);
}
