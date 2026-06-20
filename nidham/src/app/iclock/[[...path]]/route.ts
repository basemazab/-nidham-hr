// ============================================================================
// /iclock/* — ZKTeco ADMS / Cloud-push ingest endpoint
// ============================================================================
//
// ZKTeco devices with "Cloud Server Setup" PUSH data to a fixed set of paths
// under /iclock using a quirky plain-text HTTP protocol. The device sends its
// Serial Number (SN) on every request; we authenticate by matching that SN to
// a registered `attendance_devices` row (the device carries no token/cookie —
// this is how ADMS works). Flow:
//
//   GET  /iclock/cdata?SN=..&options=all     → handshake: reply with config
//   POST /iclock/cdata?SN=..&table=ATTLOG    → punches (tab-separated lines)
//   GET  /iclock/getrequest?SN=..            → device polls for commands → OK
//
// Punches are mapped PIN→employee (employee_code = device enroll-ID), folded
// into one attendance row per employee/day (earliest punch = check_in, latest
// = check_out), and tagged with a per-device-per-day import_batch_id so they
// land in the existing review/approve page (/dashboard/attendance/review).
//
// SECURITY: the protocol gives us only the SN, so auth = SN allow-list (device
// must be registered + active). Unknown SNs get a benign "OK" and store
// nothing. Bypassed from the proxy/session refresh (src/proxy.ts matcher).

import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const OK = (body = "OK") =>
  new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

const SHIFT_START_MIN = 9 * 60; // 09:00 default — HR can edit per row in review
const MAX_PUNCHES = 5000; // hard cap per push to bound work / abuse

type DeviceRow = {
  id: string;
  company_id: string;
  is_active: boolean;
};

// Deterministic per-device-per-day UUID so all of a day's punches from one
// device group into a single reviewable "batch" instead of hundreds of tiny
// ones. (md5 → UUID-shaped; stable, not security-sensitive.)
function deviceBatchId(deviceId: string, date: string): string {
  const h = createHash("md5").update(`zk:${deviceId}:${date}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

async function findDevice(sn: string | null): Promise<DeviceRow | null> {
  if (!sn) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("attendance_devices")
    .select("id, company_id, is_active")
    .eq("serial_number", sn)
    .eq("is_active", true)
    .maybeSingle<DeviceRow>();
  return data ?? null;
}

async function touchDevice(deviceId: string, fields: Record<string, unknown>) {
  const supabase = createServiceClient();
  await supabase.from("attendance_devices").update(fields).eq("id", deviceId);
}

// ── GET: handshake (cdata) + command poll (getrequest) + misc ──
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sn = url.searchParams.get("SN");
  const endpoint = url.pathname.split("/").filter(Boolean).pop() ?? "";

  const device = await findDevice(sn);
  if (device) {
    void touchDevice(device.id, { last_seen_at: new Date().toISOString() });
  }

  // Handshake — device asks for its operating config. This response is broadly
  // compatible with ZKTeco push firmware; Realtime=1 makes it push punches as
  // they happen. (Unknown/!active SN still gets a config so it doesn't error;
  // it just can't store anything on POST.)
  if (endpoint === "cdata") {
    const body = [
      `GET OPTION FROM: ${sn ?? "device"}`,
      "ATTLOGStamp=None",
      "OPERLOGStamp=9999",
      "ATTPHOTOStamp=None",
      "ErrorDelay=30",
      "Delay=30",
      "TransTimes=00:00;14:05",
      "TransInterval=1",
      "TransFlag=1111000000",
      "TimeZone=2",
      "Realtime=1",
      "Encrypt=None",
    ].join("\n");
    return OK(body);
  }

  // getrequest / devicecmd / anything else → no pending commands.
  return OK("OK");
}

// ── POST: data push (cdata?table=ATTLOG) ──
export async function POST(req: Request) {
  const url = new URL(req.url);
  const sn = url.searchParams.get("SN");
  const table = (url.searchParams.get("table") ?? "").toUpperCase();

  const device = await findDevice(sn);
  // Unknown / inactive device → benign OK, store nothing (don't reveal config).
  if (!device) return OK("OK");

  void touchDevice(device.id, { last_seen_at: new Date().toISOString() });

  // We only ingest attendance logs. Ack other tables (OPERLOG/ATTPHOTO) so the
  // device clears its queue and doesn't retry forever.
  if (table && table !== "ATTLOG") return OK("OK");

  const raw = await req.text();
  const punches = parseAttlog(raw);
  if (punches.length === 0) return OK("OK: 0");

  const accepted = await ingestPunches(device, punches);

  return OK(`OK: ${accepted}`);
}

// ── Parse the tab-separated ATTLOG body into {pin, date, time} punches ──
type Punch = { pin: string; date: string; time: string };

function parseAttlog(raw: string): Punch[] {
  const out: Punch[] = [];
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (out.length >= MAX_PUNCHES) break;
    // Standard ZKTeco ATTLOG is tab-separated:
    //   PIN \t YYYY-MM-DD HH:MM:SS \t status \t verify \t workcode ...
    // but some firmware and ZK-protocol clones emit space-separated columns
    // and/or drop the seconds. Be tolerant: PIN = first token (tab OR space);
    // timestamp = the first YYYY-MM-DD HH:MM[:SS] found anywhere on the line.
    const pin = (t.split(/[\t ]+/)[0] ?? "").trim();
    const m = t.match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2}|\d{2}:\d{2})\b/);
    if (!pin || !m) continue;
    const time = m[2].length === 5 ? `${m[2]}:00` : m[2];
    out.push({ pin, date: m[1], time });
  }
  return out;
}

// ── Map PIN→employee, fold into one row/employee/day, upsert into attendance ──
async function ingestPunches(device: DeviceRow, punches: Punch[]): Promise<number> {
  const supabase = createServiceClient();

  // 1) Resolve PINs → employees (device enroll-ID is matched to employee_code).
  const pins = [...new Set(punches.map((p) => p.pin))];
  const { data: emps } = await supabase
    .from("employees")
    .select("id, employee_code")
    .eq("company_id", device.company_id)
    .in("employee_code", pins);
  const pinToEmp = new Map<string, string>();
  for (const e of emps ?? []) {
    if (e.employee_code) pinToEmp.set(String(e.employee_code), e.id as string);
  }

  // 2) Group matched punches by employee+date → min/max time.
  type Agg = { employee_id: string; date: string; min: string; max: string };
  const groups = new Map<string, Agg>();
  for (const p of punches) {
    const employee_id = pinToEmp.get(p.pin);
    if (!employee_id) continue; // unmatched PIN — skip (HR can add the code)
    const key = `${employee_id}|${p.date}`;
    const g = groups.get(key);
    if (!g) {
      groups.set(key, { employee_id, date: p.date, min: p.time, max: p.time });
    } else {
      if (p.time < g.min) g.min = p.time;
      if (p.time > g.max) g.max = p.time;
    }
  }
  if (groups.size === 0) return 0;

  // 3) Merge with any existing rows (a check-in pushed earlier, check-out now).
  const employeeIds = [...new Set([...groups.values()].map((g) => g.employee_id))];
  const dates = [...new Set([...groups.values()].map((g) => g.date))];
  const { data: existing } = await supabase
    .from("attendance")
    .select("employee_id, date, check_in, check_out")
    .eq("company_id", device.company_id)
    .in("employee_id", employeeIds)
    .in("date", dates);
  const existingMap = new Map<string, { check_in: string | null; check_out: string | null }>();
  for (const r of existing ?? []) {
    existingMap.set(`${r.employee_id}|${r.date}`, {
      check_in: (r.check_in as string | null) ?? null,
      check_out: (r.check_out as string | null) ?? null,
    });
  }

  const nowIso = new Date().toISOString();
  const records = [...groups.values()].map((g) => {
    const key = `${g.employee_id}|${g.date}`;
    const prev = existingMap.get(key);
    const check_in = minTime(prev?.check_in ?? null, g.min);
    const check_out = maxTime(prev?.check_out ?? null, g.max);
    return {
      company_id: device.company_id,
      employee_id: g.employee_id,
      date: g.date,
      status: "present",
      check_in,
      check_out,
      tardiness_minutes: tardiness(check_in),
      notes: "بصمة تلقائية من الجهاز (ADMS)",
      import_batch_id: deviceBatchId(device.id, g.date),
      imported_at: nowIso,
    };
  });

  // 4) Upsert one row per employee/day.
  const { error } = await supabase
    .from("attendance")
    .upsert(records, { onConflict: "employee_id,date" });
  if (error) {
    console.error("[iclock] attendance upsert failed:", error.message);
    return 0;
  }

  await touchDevice(device.id, {
    last_push_at: nowIso,
    last_seen_at: nowIso,
  });
  // Bump lifetime punch counter (best-effort; not transactional).
  await supabase.rpc("increment_device_punches", {
    p_device_id: device.id,
    p_count: punches.length,
  }).then(
    () => undefined,
    () => undefined, // RPC optional — ignore if not present
  );

  return records.length;
}

// ── time helpers (HH:MM:SS strings are zero-padded → lexical compare is safe) ──
function minTime(a: string | null, b: string): string {
  if (!a) return b;
  return a < b ? a : b;
}
function maxTime(a: string | null, b: string): string {
  if (!a) return b;
  return a > b ? a : b;
}
function tardiness(checkIn: string): number {
  const m = checkIn.match(/^(\d{2}):(\d{2})/);
  if (!m) return 0;
  const mins = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return Math.max(0, Math.min(720, mins - SHIFT_START_MIN));
}
