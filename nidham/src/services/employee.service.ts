import type { SupabaseClient } from "@supabase/supabase-js";
import { arabicizeDbError } from "@/lib/i18n";
import { sendEmail, emailMobileInvitation } from "@/lib/email";
import { err, ok, type ActionResult } from "@/lib/result";

// ---------------------------------------------------------------------------
// Shared constants & helpers
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["active", "on_leave", "terminated", "resigned", "inactive"] as const;
const VALID_TERMINATION_REASONS = [
  "resignation",
  "termination_by_employer",
  "mutual_agreement",
  "end_of_contract",
  "retirement",
  "death",
] as const;

export type EOSBreakdown = {
  hire_date: string;
  termination_date: string;
  years_of_service: number;
  wage_base: number;
  months_owed: number;
  gratuity_amount: number;
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export type CreateEmployeeParams = {
  full_name: string;
  employee_code: string | null;
  job_title: string | null;
  department: string | null;
  reports_to: string | null;
  phone: string | null;
  email: string | null;
  hire_date: string | null;
  date_of_birth: string | null;
  contract_type: string;
  contract_start: string | null;
  contract_end: string | null;
  basic_salary: number | null;
  housing_allowance: number | null;
  transport_allowance: number | null;
  other_allowances: number | null;
  incentive_allowance: number | null;
  pay_frequency: "weekly" | "monthly";
  national_id: string | null;
  social_insurance_number: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  status: string;
  notes: string | null;
};

export async function createEmployee(
  supabase: SupabaseClient,
  companyId: string,
  params: CreateEmployeeParams,
): Promise<ActionResult> {
  const { error } = await supabase.from("employees").insert({
    full_name: params.full_name,
    employee_code: params.employee_code,
    job_title: params.job_title,
    department: params.department,
    phone: params.phone,
    email: params.email,
    hire_date: params.hire_date,
    date_of_birth: params.date_of_birth,
    contract_type: params.contract_type,
    contract_start: params.contract_start,
    contract_end: params.contract_end,
    basic_salary: params.basic_salary,
    housing_allowance: params.housing_allowance,
    transport_allowance: params.transport_allowance,
    other_allowances: params.other_allowances,
    incentive_allowance: params.incentive_allowance,
    pay_frequency: params.pay_frequency,
    national_id: params.national_id,
    social_insurance_number: params.social_insurance_number,
    bank_name: params.bank_name,
    bank_account_number: params.bank_account_number,
    status: params.status,
    notes: params.notes,
    company_id: companyId,
  });

  if (error) {
    return err(arabicizeDbError(error.message));
  }
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export type UpdateEmployeeParams = CreateEmployeeParams;

export async function updateEmployee(
  supabase: SupabaseClient,
  companyId: string,
  id: string,
  params: UpdateEmployeeParams,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("employees")
    .update({
      full_name: params.full_name,
      employee_code: params.employee_code,
      job_title: params.job_title,
      department: params.department,
      reports_to: params.reports_to,
      phone: params.phone,
      email: params.email,
      hire_date: params.hire_date,
      contract_type: params.contract_type,
      contract_start: params.contract_start,
      contract_end: params.contract_end,
      basic_salary: params.basic_salary,
      housing_allowance: params.housing_allowance,
      transport_allowance: params.transport_allowance,
      other_allowances: params.other_allowances,
      incentive_allowance: params.incentive_allowance,
      pay_frequency: params.pay_frequency,
      national_id: params.national_id,
      social_insurance_number: params.social_insurance_number,
      bank_name: params.bank_name,
      bank_account_number: params.bank_account_number,
      status: params.status,
      notes: params.notes,
    })
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    return err(arabicizeDbError(error.message));
  }
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Set status (active / terminated / resigned / etc.)
// ---------------------------------------------------------------------------

export async function setEmployeeStatus(
  supabase: SupabaseClient,
  companyId: string,
  employeeId: string,
  status: string,
): Promise<ActionResult> {
  if (!(VALID_STATUSES as readonly string[]).includes(status)) {
    return err("حالة غير صالحة");
  }

  const updateData: Record<string, unknown> = { status };

  if (
    (status === "terminated" || status === "resigned" || status === "inactive") &&
    !(
      status === "inactive" &&
      (
        await supabase.from("employees").select("status").eq("id", employeeId).maybeSingle()
      )?.data?.status === "inactive"
    )
  ) {
    const today = new Date().toISOString().split("T")[0];
    updateData.termination_date = today;
    if (status === "resigned") updateData.termination_reason = "resignation";
    if (status === "terminated") updateData.termination_reason = "termination_by_employer";
  }

  if (status === "active") {
    updateData.termination_date = null;
    updateData.termination_reason = null;
    updateData.eos_gratuity = null;
  }

  const { error } = await supabase
    .from("employees")
    .update(updateData)
    .eq("id", employeeId)
    .eq("company_id", companyId);

  if (error) {
    return err(arabicizeDbError(error.message));
  }
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Preview EOS gratuity (read-only RPC)
// ---------------------------------------------------------------------------

export async function previewEOSGratuity(
  supabase: SupabaseClient,
  employeeId: string,
  terminationDate: string,
): Promise<EOSBreakdown | null> {
  const { data } = await supabase.rpc("compute_eos_gratuity", {
    p_employee_id: employeeId,
    p_termination_date: terminationDate,
  });
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  return row as EOSBreakdown;
}

// ---------------------------------------------------------------------------
// Terminate employee (admin-only — writes EOS snapshot)
// ---------------------------------------------------------------------------

export async function terminateEmployee(
  supabase: SupabaseClient,
  companyId: string,
  employeeId: string,
  terminationDate: string,
  reason: string,
): Promise<ActionResult<{ gratuity_amount: number; years_of_service: number; months_owed: number }>> {
  if (!(VALID_TERMINATION_REASONS as readonly string[]).includes(reason)) {
    return err("سبب انتهاء الخدمة غير صحيح");
  }

  const eos = await previewEOSGratuity(supabase, employeeId, terminationDate);
  if (!eos) {
    return err("مش قادر يحسب المكافأة — تأكد إن للموظف تاريخ تعيين");
  }

  const { error } = await supabase
    .from("employees")
    .update({
      status: "terminated",
      termination_date: terminationDate,
      termination_reason: reason,
      eos_gratuity: eos.gratuity_amount,
    })
    .eq("id", employeeId)
    .eq("company_id", companyId);

  if (error) {
    return err(arabicizeDbError(error.message));
  }

  return ok({
    gratuity_amount: eos.gratuity_amount,
    years_of_service: eos.years_of_service,
    months_owed: eos.months_owed,
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteEmployee(
  supabase: SupabaseClient,
  companyId: string,
  id: string,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);
  if (error) {
    return err("ما قدرناش نمسح الموظف: " + error.message);
  }
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Delete all
// ---------------------------------------------------------------------------

export async function deleteAllEmployees(
  supabase: SupabaseClient,
  companyId: string,
  confirmPhrase: string,
): Promise<ActionResult<{ count: number }>> {
  if (confirmPhrase !== "حذف الكل") {
    return err("لازم تكتب 'حذف الكل' بالظبط عشان تأكد.");
  }

  const { count } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (!count || count === 0) {
    return err("مفيش موظفين عندك أصلاً.");
  }

  const { error } = await supabase
    .from("employees")
    .delete()
    .eq("company_id", companyId);

  if (error) {
    return err(arabicizeDbError(error.message));
  }

  return ok({ count });
}

// ---------------------------------------------------------------------------
// Invitation
// ---------------------------------------------------------------------------

export async function generateEmployeeInvitation(
  supabase: SupabaseClient,
  employeeId: string,
): Promise<ActionResult> {
  const { error } = await supabase.rpc("generate_employee_invitation", {
    p_employee_id: employeeId,
  });
  if (error) {
    return err(arabicizeDbError(error.message));
  }

  void (async () => {
    try {
      const { data: emp } = await supabase
        .from("employees")
        .select("full_name, email, invitation_token")
        .eq("id", employeeId)
        .single<{
          full_name: string;
          email: string | null;
          invitation_token: string | null;
        }>();
      if (!emp?.email || !emp?.invitation_token) return;
      await sendEmail(
        emailMobileInvitation({
          to: emp.email,
          employeeName: emp.full_name,
          inviteToken: emp.invitation_token,
        }),
      );
    } catch {
      console.warn("generateEmployeeInvitation email failed");
    }
  })();

  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

const FILES_BUCKET = "employee-files";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_AVATAR_MIMES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function fileExtension(mime: string, filename: string): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  };
  if (map[mime]) return map[mime];
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx >= 0 && dotIdx < filename.length - 1) {
    return filename.slice(dotIdx + 1).toLowerCase();
  }
  return "bin";
}

export async function uploadEmployeeAvatar(
  supabase: SupabaseClient,
  companyId: string,
  employeeId: string,
  file: File,
): Promise<ActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) {
    return err("معرف الموظف غير صالح");
  }
  if (file.size === 0) {
    return err("اختار صورة الأول");
  }
  if (file.size > MAX_FILE_BYTES) {
    return err(`الصورة كبيرة (${(file.size / 1024 / 1024).toFixed(1)} MB). الحد 10 MB.`);
  }
  if (!ALLOWED_AVATAR_MIMES.includes(file.type)) {
    return err(`نوع الصورة مش مدعوم (${file.type}). PNG / JPEG / WebP / GIF فقط.`);
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = fileExtension(file.type, file.name);
    const ts = Date.now();
    const path = `${companyId}/${employeeId}/avatar/${ts}-photo.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
        cacheControl: "31536000",
      });
    if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

    const { data: pub } = supabase.storage.from(FILES_BUCKET).getPublicUrl(path);

    const { error: updErr } = await supabase
      .from("employees")
      .update({
        avatar_url: pub.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employeeId)
      .eq("company_id", companyId);
    if (updErr) throw new Error(updErr.message);
    } catch (uploadErr) {
    return err(
      uploadErr instanceof Error
        ? `رفع الصورة فشل: ${uploadErr.message.slice(0, 200)}`
        : "رفع الصورة فشل",
    );
  }

  return ok(undefined);
}

export async function removeEmployeeAvatar(
  supabase: SupabaseClient,
  companyId: string,
  employeeId: string,
): Promise<ActionResult> {
  await supabase
    .from("employees")
    .update({ avatar_url: null, updated_at: new Date().toISOString() })
    .eq("id", employeeId)
    .eq("company_id", companyId);
  return ok(undefined);
}

// ---------------------------------------------------------------------------
// Document vault
// ---------------------------------------------------------------------------

const ALLOWED_DOC_MIMES = [
  ...ALLOWED_AVATAR_MIMES,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const ALLOWED_DOC_TYPES = [
  "contract",
  "national_id",
  "cv",
  "certificate",
  "photo",
  "license",
  "insurance",
  "bank",
  "medical",
  "other",
] as const;
type DocType = (typeof ALLOWED_DOC_TYPES)[number];

export type UploadDocumentParams = {
  employeeId: string;
  docType: string;
  displayName: string;
  expiresAt: string | null;
  file: File;
};

export async function uploadEmployeeDocument(
  supabase: SupabaseClient,
  companyId: string,
  params: UploadDocumentParams,
): Promise<ActionResult> {
  const { employeeId, docType: docTypeRaw, displayName, expiresAt: expiresAtRaw, file } = params;

  if (!/^[0-9a-f-]{36}$/i.test(employeeId)) {
    return err("معرف الموظف غير صالح");
  }

  const docType: DocType = (ALLOWED_DOC_TYPES as readonly string[]).includes(docTypeRaw)
    ? (docTypeRaw as DocType)
    : "other";
  const expiresAt = expiresAtRaw || null;

  if (file.size === 0) {
    return err("اختار ملف الأول");
  }
  if (file.size > MAX_FILE_BYTES) {
    return err(`الملف كبير (${(file.size / 1024 / 1024).toFixed(1)} MB). الحد 10 MB.`);
  }
  if (!ALLOWED_DOC_MIMES.includes(file.type)) {
    return err(`نوع الملف مش مدعوم (${file.type}).`);
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = fileExtension(file.type, file.name);
    const ts = Date.now();
    const safeName = (displayName || file.name.replace(/\.[^/.]+$/, ""))
      .replace(/[^\p{L}\p{N}_-]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "doc";
    const path = `${companyId}/${employeeId}/docs/${ts}-${safeName}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(path, bytes, {
        contentType: file.type,
        upsert: false,
        cacheControl: "31536000",
      });
    if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

    const { data: pub } = supabase.storage.from(FILES_BUCKET).getPublicUrl(path);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error: insErr } = await supabase.from("employee_documents").insert({
      company_id: companyId,
      employee_id: employeeId,
      doc_type: docType,
      name: displayName || file.name,
      file_url: pub.publicUrl,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
      expires_at: expiresAt,
      uploaded_by: user?.id ?? null,
    });
    if (insErr) {
      await supabase.storage.from(FILES_BUCKET).remove([path]);
      throw new Error(insErr.message);
    }
    } catch (uploadErr) {
    return err(
      uploadErr instanceof Error
        ? `رفع المستند فشل: ${uploadErr.message.slice(0, 200)}`
        : "رفع المستند فشل",
    );
  }

  return ok(undefined);
}

export async function deleteEmployeeDocument(
  supabase: SupabaseClient,
  companyId: string,
  documentId: string,
  employeeId: string,
): Promise<ActionResult> {
  if (!/^[0-9a-f-]{36}$/i.test(documentId) || !/^[0-9a-f-]{36}$/i.test(employeeId)) {
    return err("معرف غير صالح");
  }

  const { data: doc } = await supabase
    .from("employee_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("company_id", companyId)
    .maybeSingle<{ storage_path: string }>();

  await supabase
    .from("employee_documents")
    .delete()
    .eq("id", documentId)
    .eq("company_id", companyId);

  if (doc?.storage_path) {
    await supabase.storage.from(FILES_BUCKET).remove([doc.storage_path]);
  }

  return ok(undefined);
}
