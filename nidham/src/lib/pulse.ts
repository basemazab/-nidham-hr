// ============================================================================
// نبض نيدهام (Nidham Pulse) — AI Chief of Staff
// ============================================================================
//
// Scans EVERY module of the tenant (HR attendance, leaves, advances, payroll
// cost, expiring documents, ending CRM contracts, new/hot leads, inbox
// conversations needing a human, birthdays + work anniversaries) and produces
// a prioritized daily executive briefing in Egyptian Arabic.
//
// Design: the numbers are computed DETERMINISTICALLY here (no AI involved),
// then the AI only prioritizes and narrates them — so it can never invent a
// figure. Links are mapped from category in code, never written by the model.

import { z } from "zod";
import { generateObject } from "ai";
import { callWithFallback, pickAgentModelLargeContext } from "@/lib/ai-models";

// Minimal query surface we need — keeps this lib usable with both the
// RLS-scoped server client and (later) the service client in a cron.
type Db = {
  from(table: string): {
    select(cols: string): {
      eq(c: string, v: unknown): unknown;
      in(c: string, v: unknown[]): unknown;
      gte(c: string, v: string): unknown;
      lte(c: string, v: string): unknown;
    };
  };
};

/* eslint-disable @typescript-eslint/no-explicit-any */

function iso(d: Date): string {
  return d.toISOString().split("T")[0];
}

export type PulseData = Awaited<ReturnType<typeof collectPulseData>>;

export async function collectPulseData(supabase: any, companyId: string) {
  const now = new Date();
  const todayIso = iso(now);
  const ago7 = new Date(now);
  ago7.setDate(now.getDate() - 7);
  const in30 = new Date(now);
  in30.setDate(now.getDate() + 30);
  const ago72h = new Date(now.getTime() - 72 * 3600_000).toISOString();

  // ── Employees first (names map + payroll estimate + people signals) ──
  const { data: empData } = await supabase
    .from("employees")
    .select(
      "id, full_name, department, job_title, hire_date, date_of_birth, basic_salary, housing_allowance, transport_allowance, other_allowances, incentive_allowance, status",
    )
    .eq("company_id", companyId)
    .eq("status", "active");

  const employees: any[] = empData ?? [];
  const empIds = employees.map((e) => e.id);
  const nameOf = new Map<string, string>(
    employees.map((e) => [e.id as string, (e.full_name as string) || "موظف"]),
  );

  const estMonthlyPayroll = Math.round(
    employees.reduce(
      (s, e) =>
        s +
        (e.basic_salary ?? 0) +
        (e.housing_allowance ?? 0) +
        (e.transport_allowance ?? 0) +
        (e.other_allowances ?? 0) +
        (e.incentive_allowance ?? 0),
      0,
    ),
  );

  // ── Everything else in parallel (each tolerant to missing tables) ──
  const [
    attTodayRes,
    attWeekRes,
    pendingLeavesRes,
    onLeaveTodayRes,
    pendingAdvancesRes,
    docsRes,
    contractsRes,
    newCustomersRes,
    convsRes,
  ] = await Promise.all([
    empIds.length
      ? supabase
          .from("attendance")
          .select("employee_id, status, tardiness_minutes")
          .in("employee_id", empIds)
          .eq("date", todayIso)
      : Promise.resolve({ data: [] }),
    empIds.length
      ? supabase
          .from("attendance")
          .select("employee_id, status")
          .in("employee_id", empIds)
          .gte("date", iso(ago7))
          .lte("date", todayIso)
      : Promise.resolve({ data: [] }),
    empIds.length
      ? supabase
          .from("leave_requests")
          .select("employee_id, leave_type, days_count, start_date, created_at")
          .in("employee_id", empIds)
          .eq("status", "pending")
      : Promise.resolve({ data: [] }),
    empIds.length
      ? supabase
          .from("leave_requests")
          .select("employee_id, end_date")
          .in("employee_id", empIds)
          .eq("status", "approved")
          .lte("start_date", todayIso)
          .gte("end_date", todayIso)
      : Promise.resolve({ data: [] }),
    empIds.length
      ? supabase
          .from("advance_requests")
          .select("employee_id, amount")
          .in("employee_id", empIds)
          .eq("status", "pending")
      : Promise.resolve({ data: [] }),
    supabase
      .from("employee_documents")
      .select("name, doc_type, expires_at, employee_id")
      .eq("company_id", companyId)
      .gte("expires_at", todayIso)
      .lte("expires_at", iso(in30)),
    supabase
      .from("contracts")
      .select("contract_number, end_date, contract_value, status, customers:customer_id(full_name)")
      .eq("company_id", companyId)
      .gte("end_date", todayIso)
      .lte("end_date", iso(in30)),
    supabase
      .from("customers")
      .select("full_name, status, estimated_value, created_at")
      .eq("company_id", companyId)
      .gte("created_at", ago7.toISOString()),
    supabase
      .from("marketing_inbox_conversations")
      .select("external_user_name, status, ai_lead_quality, last_message_at")
      .eq("company_id", companyId),
  ]);

  // ── Attendance today ──
  const attToday: any[] = attTodayRes?.data ?? [];
  const present = attToday.filter((r) => r.status === "present").length;
  const absentRows = attToday.filter((r) => r.status === "absent");
  const lateRows = attToday.filter((r) => (r.tardiness_minutes ?? 0) > 15);
  const absentNames = absentRows.slice(0, 6).map((r) => nameOf.get(r.employee_id) ?? "موظف");
  const lateNames = lateRows
    .slice(0, 6)
    .map((r) => `${nameOf.get(r.employee_id) ?? "موظف"} (${r.tardiness_minutes} دقيقة)`);

  // ── Repeat absentees (3+ absences in the last 7 days) ──
  const attWeek: any[] = attWeekRes?.data ?? [];
  const absenceCount = new Map<string, number>();
  for (const r of attWeek) {
    if (r.status === "absent") {
      absenceCount.set(r.employee_id, (absenceCount.get(r.employee_id) ?? 0) + 1);
    }
  }
  const repeatAbsentees = [...absenceCount.entries()]
    .filter(([, c]) => c >= 3)
    .map(([id, c]) => `${nameOf.get(id) ?? "موظف"} (${c} أيام غياب في أسبوع)`)
    .slice(0, 5);

  // ── Leaves + advances ──
  const pendingLeaves: any[] = pendingLeavesRes?.data ?? [];
  const onLeaveToday = (onLeaveTodayRes?.data ?? []).map(
    (r: any) => nameOf.get(r.employee_id) ?? "موظف",
  );
  const pendingAdvances: any[] = pendingAdvancesRes?.data ?? [];
  const pendingAdvancesTotal = pendingAdvances.reduce((s, r) => s + (r.amount ?? 0), 0);

  // ── Compliance: expiring docs + ending CRM contracts ──
  const expiringDocs = (docsRes?.data ?? []).slice(0, 8).map((d: any) => ({
    doc: d.name || d.doc_type || "مستند",
    employee: nameOf.get(d.employee_id) ?? "موظف",
    expires: d.expires_at,
  }));
  const endingContracts = (contractsRes?.data ?? []).slice(0, 8).map((c: any) => ({
    contract: c.contract_number || "عقد",
    customer: c.customers?.full_name ?? "عميل",
    ends: c.end_date,
    value: c.contract_value ?? 0,
  }));

  // ── CRM + Marketing inbox ──
  const newCustomers: any[] = newCustomersRes?.data ?? [];
  const convs: any[] = convsRes?.data ?? [];
  const openConvs = convs.filter((c) => c.status === "open").length;
  const hotRecent = convs
    .filter((c) => c.ai_lead_quality === "hot" && c.last_message_at >= ago72h)
    .slice(0, 6)
    .map((c) => c.external_user_name || "عميل");

  // ── People: birthdays next 7 days + anniversaries this month ──
  const birthdays: string[] = [];
  const anniversaries: string[] = [];
  for (const e of employees) {
    if (e.date_of_birth) {
      const b = new Date(e.date_of_birth + "T00:00:00");
      const next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
      if (next < now) next.setFullYear(now.getFullYear() + 1);
      const days = Math.floor((next.getTime() - now.getTime()) / 86_400_000);
      if (days >= 0 && days <= 7) birthdays.push(`${e.full_name} (بعد ${days === 0 ? "النهاردة" : days + " يوم"})`);
    }
    if (e.hire_date) {
      const h = new Date(e.hire_date + "T00:00:00");
      const years = now.getFullYear() - h.getFullYear();
      if (years >= 1 && h.getMonth() === now.getMonth()) {
        anniversaries.push(`${e.full_name} (${years} سنة)`);
      }
    }
  }

  return {
    date: todayIso,
    headcount: employees.length,
    estMonthlyPayroll,
    attendance: {
      recorded: attToday.length,
      present,
      absent: absentRows.length,
      late: lateRows.length,
      absentNames,
      lateNames,
      repeatAbsentees,
    },
    leaves: {
      pending: pendingLeaves.length,
      onLeaveToday,
    },
    advances: {
      pending: pendingAdvances.length,
      totalAmount: pendingAdvancesTotal,
    },
    compliance: {
      expiringDocs,
      endingContracts,
    },
    crm: {
      newLeads7d: newCustomers.length,
      newLeadsValue: Math.round(
        newCustomers.reduce((s, c) => s + (c.estimated_value ?? 0), 0),
      ),
      openConversations: openConvs,
      hotLeadsLast72h: hotRecent,
    },
    people: {
      birthdays: birthdays.slice(0, 5),
      anniversaries: anniversaries.slice(0, 5),
    },
  };
}

// ── AI brief ──

export const pulseBriefSchema = z.object({
  headline: z
    .string()
    .describe(
      "جملة افتتاحية تنفيذية واحدة بالعربي المصري تلخّص حال الشركة النهاردة — مباشرة وبالأرقام المهمة",
    ),
  health_score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "تقييم صحة الشركة النهاردة 0-100: الحضور والالتزام والـ pipeline والامتثال كلهم بوزن متوازن",
    ),
  items: z
    .array(
      z.object({
        severity: z
          .enum(["critical", "warning", "opportunity", "info"])
          .describe(
            "critical = محتاج تصرف النهاردة. warning = يتراقب. opportunity = فرصة تتاخد (عميل سخن، عقد للتجديد). info = للعلم (عيد ميلاد...)",
          ),
        category: z.enum([
          "attendance",
          "hr",
          "payroll",
          "compliance",
          "crm",
          "marketing",
          "people",
        ]),
        title: z.string().describe("عنوان قصير وواضح للبند"),
        detail: z
          .string()
          .describe(
            "التفاصيل بالأرقام والأسماء من البيانات المعطاة فقط — ممنوع منعًا باتًا اختراع أي رقم أو اسم",
          ),
        action: z
          .string()
          .describe("خطوة عملية واحدة محددة يعملها المدير دلوقتي"),
      }),
    )
    .min(3)
    .max(12)
    .describe("بنود البريفينج مرتبة بالأولوية — الحرج الأول ثم التحذير ثم الفرص ثم للعلم"),
});

export type PulseBrief = z.infer<typeof pulseBriefSchema>;

// Category → dashboard link, mapped in CODE so the model never writes URLs.
export const PULSE_CATEGORY_LINKS: Record<string, { href: string; label: string }> = {
  attendance: { href: "/dashboard/attendance", label: "الحضور" },
  hr: { href: "/dashboard/employees", label: "الفريق" },
  payroll: { href: "/dashboard/payroll", label: "المرتبات" },
  compliance: { href: "/dashboard/contracts-renewals", label: "التجديدات" },
  crm: { href: "/dashboard/customers", label: "العملاء" },
  marketing: { href: "/dashboard/marketing/inbox", label: "صندوق الرسائل" },
  people: { href: "/dashboard/employees", label: "الفريق" },
};

export async function generatePulseBrief(data: PulseData): Promise<PulseBrief> {
  const prompt = `إنت «نبض نيدهام» — مدير المكتب التنفيذي الآلي لشركة مصرية. دي بيانات الشركة النهاردة، محسوبة بدقة من قاعدة البيانات (مش تقديرات):

${JSON.stringify(data, null, 1)}

اكتب البريفينج التنفيذي اليومي بالعربي المصري:
- اربط بين الإشارات لو فيه علاقة (غياب متكرر + سلف معلقة لنفس الشخص = إشارة أقوى).
- البنود الحرجة الأول، وكل بند معاه خطوة عملية واحدة واضحة.
- لو فيه عملاء سخنين أو عقود بتخلص: دي فرص بفلوس — خليها بارزة.
- ممنوع منعًا باتًا تخترع أي رقم أو اسم أو معلومة مش في البيانات دي.
- لو البيانات قليلة (شركة جديدة)، قول كده بصراحة واقترح أول خطوات التشغيل.`;

  return callWithFallback(
    (picked) =>
      generateObject({
        model: picked.model,
        schema: pulseBriefSchema,
        prompt,
        temperature: 0.3,
        maxRetries: 0,
      }).then((r) => r.object),
    pickAgentModelLargeContext,
  );
}
