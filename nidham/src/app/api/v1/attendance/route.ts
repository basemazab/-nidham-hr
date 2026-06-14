import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  authenticateApiRequest,
  jsonResponse,
  errorResponse,
} from "@/lib/api/middleware";

// GET /api/v1/attendance — paginated attendance records for the authenticated
// company. The #1 endpoint for ERP/payroll sync (e.g. Odoo pulling daily
// punches). Filter by date range (from/to), employee, or status.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiRequest(req, "attendance:read");
  if (!auth.authenticated) {
    return errorResponse(auth.error!, auth.status!);
  }

  const supabase = await createClient();
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
