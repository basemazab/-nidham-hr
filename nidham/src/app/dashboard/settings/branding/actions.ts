"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { createServiceClient } from "@/lib/supabase/service";

// Generous ceiling for a client-resized logo (~450 KB of base64). The branding
// client downscales to ≤400px before upload, so a real logo lands far under
// this; the cap just guards against someone POSTing a huge string.
const MAX_LOGO_CHARS = 600_000;

const DATA_URL_RE = /^data:image\/(png|jpe?g|webp|svg\+xml);base64,[A-Za-z0-9+/=\s]+$/;

export async function saveLogo(
  dataUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const { profile } = await requireAdmin();
  if (!profile.company_id) return { ok: false, error: "لا توجد شركة مرتبطة بالحساب" };

  if (typeof dataUrl !== "string" || !DATA_URL_RE.test(dataUrl)) {
    return { ok: false, error: "صيغة الصورة غير صالحة — ارفع PNG أو JPG أو SVG" };
  }
  if (dataUrl.length > MAX_LOGO_CHARS) {
    return { ok: false, error: "حجم الصورة كبير جدًا — جرّب صورة أصغر" };
  }

  // Service client + explicit company scope: updating companies doesn't depend
  // on an UPDATE RLS policy this way, and the admin gate above is the auth.
  const svc = createServiceClient();
  const { error } = await svc
    .from("companies")
    .update({ logo_url: dataUrl })
    .eq("id", profile.company_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/settings/branding");
  revalidatePath("/dashboard/memo-studio");
  return { ok: true };
}

export async function removeLogo(): Promise<{ ok: boolean; error?: string }> {
  const { profile } = await requireAdmin();
  if (!profile.company_id) return { ok: false, error: "لا توجد شركة" };

  const svc = createServiceClient();
  const { error } = await svc
    .from("companies")
    .update({ logo_url: null })
    .eq("id", profile.company_id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/settings/branding");
  revalidatePath("/dashboard/memo-studio");
  return { ok: true };
}
