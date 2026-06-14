import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  authenticateApiRequest,
  jsonResponse,
  errorResponse,
} from "@/lib/api/middleware";

// API requests carry no Supabase session, so we use the service client and
// scope EVERY query by the API key's company_id (returned by the middleware) —
// that explicit filter is what enforces tenant isolation here.

const VALID_STATUS = new Set([
  "present",
  "absent",
  "half_day",
  "leave",
  "holiday",
  "weekend",
]);
const TIME_RE = /^\d{1,2}:\d{2}(:\d{2})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WRITE = 500;

// GET /api/v1/attendance — paginated attendance records for the authenticated
// company. The #1 endpoint for ERP/payroll sync (e.g. Odoo pulling daily
// punches). Filter by date range (from/to), employee, or status.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "attendance:read");
  if (!auth.authenticated) {
    return errorResponse(auth.error!, auth.status!);
  }

  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
  const from = searchParams.get("from"); // YYYY-MM-DD (inclusive)
  const to = searchParams.get("to"); // YYYY-MM-DD (inclusive)
  const employeeId = searchParams.get("employee_id");
  const status = searchParams.get("status");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("attendance")
    .select(
      "id, employee_id, date, status, check_in, check_out, hours_worked, tardiness_minutes, notes, created_at, employees!inner(employee_code, full_name, department, job_title)",
      { count: "exact" },
    )
    .eq("company_id", auth.companyId!)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (employeeId) query = query.eq("employee_id", employeeId);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  });
}

// POST /api/v1/attendance — create/update attendance records (bidirectional
// sync: Odoo / a device gateway pushes punches INTO Nidham). Accepts one record
// or { records: [...] } / a bare array. Each record identifies its employee by
// `employee_id` (UUID) or `employee_code`; both are validated against THIS
// company so a key can never write to another tenant. Upserts on
// (employee_id, date) so re-syncing a day updates instead of duplicating.
type InRecord = {
  employee_id?: string;
  employee_code?: string;
  date?: string;
  status?: string;
  check_in?: string | null;
  check_out?: string | null;
  hours_worked?: number | null;
  tardiness_minutes?: number | null;
  notes?: string | null;
};

export async function POST(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "attendance:write");
  if (!auth.authenticated) {
    return errorResponse(auth.error!, auth.status!);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("جسم الطلب JSON غير صالح", 400);
  }

  // Normalize to an array of records.
  const records: InRecord[] = Array.isArray(body)
    ? (body as InRecord[])
    : body && typeof body === "object" && Array.isArray((body as { records?: unknown }).records)
      ? ((body as { records: InRecord[] }).records)
      : body && typeof body === "object"
        ? [body as InRecord]
        : [];

  if (records.length === 0) {
    return errorResponse("ابعت سجل حضور واحد على الأقل", 400);
  }
  if (records.length > MAX_WRITE) {
    return errorResponse(`الحد الأقصى ${MAX_WRITE} سجل في الطلب الواحد`, 400);
  }

  const supabase = createServiceClient();

  // Resolve the referenced employees — only within THIS company (so a key can
  // never write to another tenant). Two targeted .in() queries (parameterized,
  // injection-safe) instead of loading the whole roster.
  const ids = [...new Set(records.map((r) => r.employee_id).filter(Boolean) as string[])];
  const codes = [...new Set(records.map((r) => r.employee_code).filter(Boolean) as string[])];

  const validIds = new Set<string>();
  const codeToId = new Map<string, string>();

  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_code")
      .eq("company_id", auth.companyId!)
      .in("id", ids);
    if (error) return errorResponse(error.message, 500);
    for (const e of data ?? []) {
      validIds.add(e.id as string);
      if (e.employee_code) codeToId.set(String(e.employee_code), e.id as string);
    }
  }
  if (codes.length > 0) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_code")
      .eq("company_id", auth.companyId!)
      .in("employee_code", codes);
    if (error) return errorResponse(error.message, 500);
    for (const e of data ?? []) {
      validIds.add(e.id as string);
      if (e.employee_code) codeToId.set(String(e.employee_code), e.id as string);
    }
  }

  const toUpsert: Record<string, unknown>[] = [];
  const skipped: { index: number; reason: string }[] = [];

  records.forEach((r, index) => {
    // Resolve + authorize the employee against this company.
    let employeeId: string | undefined;
    if (r.employee_id && validIds.has(r.employee_id)) employeeId = r.employee_id;
    else if (r.employee_code && codeToId.has(r.employee_code))
      employeeId = codeToId.get(r.employee_code);

    if (!employeeId) {
      skipped.push({ index, reason: "موظف غير معروف في شركتك (employee_id/employee_code)" });
      return;
    }
    if (!r.date || !DATE_RE.test(r.date)) {
      skipped.push({ index, reason: "التاريخ مطلوب بصيغة YYYY-MM-DD" });
      return;
    }
    const status = r.status && VALID_STATUS.has(r.status) ? r.status : "present";
    const check_in = r.check_in && TIME_RE.test(r.check_in) ? r.check_in : null;
    const check_out = r.check_out && TIME_RE.test(r.check_out) ? r.check_out : null;
    const hours_worked = typeof r.hours_worked === "number" ? r.hours_worked : null;
    const tardiness_minutes =
      typeof r.tardiness_minutes === "number"
        ? Math.max(0, Math.min(720, Math.round(r.tardiness_minutes)))
        : 0;

    toUpsert.push({
      company_id: auth.companyId,
      employee_id: employeeId,
      date: r.date,
      status,
      check_in,
      check_out,
      hours_worked,
      tardiness_minutes,
      notes: typeof r.notes === "string" ? r.notes : null,
    });
  });

  if (toUpsert.length === 0) {
    return jsonResponse({ ok: false, upserted: 0, skipped }, 400);
  }

  const { error } = await supabase
    .from("attendance")
    .upsert(toUpsert, { onConflict: "employee_id,date" });

  if (error) {
    return errorResponse(error.message, 500);
  }

  return jsonResponse({ ok: true, upserted: toUpsert.length, skipped }, 201);
}
