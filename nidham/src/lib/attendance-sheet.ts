// ============================================================================
// attendance-sheet.ts — focused parser for the Board attendance report
// ============================================================================
// Reads an uploaded biometric/ZKTeco attendance sheet (Excel/CSV) and returns
// the SET of employee codes that punched + the dates covered. It deliberately
// does LESS than the full attendance import (no DB write, no tardiness/shift
// logic) — the board report only needs "who showed up".
//
// The Arabic-encoding handling mirrors the import action
// (src/app/dashboard/attendance/import/actions.ts): ZK .xls files often declare
// cp1252 while the content is cp1256, so we try several codepages and, as a
// last resort, re-decode latin1 bytes as windows-1256. Kept self-contained on
// purpose so this never risks the (working) import flow.

import * as XLSX from "xlsx";

// ── Arabic normalizer (tashkeel + alef/ya/ta-marbuta unification) ──
function normalizeArabic(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[ً-ْ]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/[ىئ]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ");
}

// ── Header aliases (FOCUSED: only what the board report needs) ──
// Keys are normalized at module load so spelling variants all match.
const RAW_ALIASES: Record<string, "code" | "date" | "time" | "check_in" | "check_out" | "status"> = {
  // employee code / biometric id
  "رقم البصمة": "code", "كود البصمة": "code", "كود الموظف": "code", "رقم الموظف": "code",
  "الكود": "code", "كود": "code", "الرقم": "code", "رقم": "code", "رقم الماكينة": "code",
  "employee code": "code", "employee_code": "code", "emp code": "code", "emp id": "code",
  "id": "code", "code": "code", "ac-no": "code", "acno": "code", "ac no": "code",
  "user id": "code", "userid": "code", "enroll id": "code", "enrollid": "code",
  "pin": "code", "machine id": "code", "no": "code", "no.": "code",
  // date
  "التاريخ": "date", "تاريخ": "date", "اليوم": "date",
  "date": "date", "att date": "date", "attendance date": "date", "day": "date",
  // bundled punch time
  "الوقت": "time", "وقت": "time", "البصمة": "time", "بصمة": "time",
  "time": "time", "punch": "time", "punch time": "time", "clock": "time",
  // separate check in/out
  "وقت الحضور": "check_in", "الحضور": "check_in", "حضور": "check_in", "دخول": "check_in",
  "check in": "check_in", "checkin": "check_in", "check-in": "check_in", "time in": "check_in", "in": "check_in",
  "وقت الانصراف": "check_out", "الانصراف": "check_out", "انصراف": "check_out", "خروج": "check_out",
  "check out": "check_out", "checkout": "check_out", "check-out": "check_out", "time out": "check_out", "out": "check_out",
  // status
  "الحالة": "status", "حالة": "status", "status": "status", "att status": "status",
};

const NORMALIZED_ALIASES: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(RAW_ALIASES)) out[normalizeArabic(k)] = v;
  return out;
})();

function lookupAlias(cell: unknown): string | null {
  if (cell === null || cell === undefined) return null;
  const s = String(cell).trim();
  if (!s) return null;
  return NORMALIZED_ALIASES[normalizeArabic(s)] ?? null;
}

// Re-decode latin1-mis-decoded Arabic cells via windows-1256 (ZK quirk).
function fixArabicEncoding(matrix: unknown[][]): unknown[][] {
  const decoder = new TextDecoder("windows-1256");
  const fixCell = (cell: unknown): unknown => {
    if (typeof cell !== "string") return cell;
    let hasHigh = false;
    for (let i = 0; i < cell.length; i += 1) {
      if (cell.charCodeAt(i) > 127) { hasHigh = true; break; }
    }
    if (!hasHigh) return cell;
    const bytes = new Uint8Array(cell.length);
    for (let i = 0; i < cell.length; i += 1) bytes[i] = cell.charCodeAt(i) & 0xff;
    return decoder.decode(bytes);
  };
  return matrix.map((row) => (Array.isArray(row) ? row.map(fixCell) : row));
}

function findHeaderRow(matrix: unknown[][]): number {
  const SCAN = Math.min(matrix.length, 15);
  let bestRow = -1;
  let bestScore = 0;
  for (let i = 0; i < SCAN; i += 1) {
    const row = matrix[i];
    if (!Array.isArray(row)) continue;
    let hits = 0;
    for (const cell of row) if (lookupAlias(cell)) hits += 1;
    if (hits > bestScore && hits >= 2) { bestScore = hits; bestRow = i; }
  }
  return bestRow;
}

function normalizeDate(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slash) return `${slash[3]}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
    const dash = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dash) return `${dash[3]}-${dash[2].padStart(2, "0")}-${dash[1].padStart(2, "0")}`;
    return null;
  }
  if (typeof raw === "number") {
    const d = new Date(new Date(1899, 11, 30).getTime() + raw * 86400000);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  return null;
}

function hasPunchTime(raw: unknown): boolean {
  if (raw === null || raw === undefined) return false;
  const s = String(raw).trim();
  if (!s) return false;
  // Any HH:MM token counts as a punch.
  return /\b\d{1,2}:\d{2}\b/.test(s);
}

const PRESENT_STATUS = new Set([
  "present", "حاضر", "موجود", "p", "حضور", "ok",
]);

/** Normalized code for matching (strip leading zeros so "007" == "7"). */
export function normalizeCode(raw: unknown): string {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "";
  const stripped = s.replace(/^0+(?=.)/, ""); // keep at least one char
  return stripped;
}

export type SheetParseResult = {
  ok: boolean;
  /** Normalized codes (see normalizeCode) that punched at least once. */
  presentCodes: string[];
  /** Distinct ISO dates found in the sheet, sorted ascending. */
  dates: string[];
  rowsParsed: number;
  headerFound: boolean;
  error?: string;
};

export function parseAttendanceSheet(buffer: ArrayBuffer): SheetParseResult {
  let matrix: unknown[][] = [];
  try {
    const CODEPAGES = [1256, 65001, 1252, 0]; // 0 = autodetect
    for (const cp of CODEPAGES) {
      const wb = XLSX.read(buffer, { type: "array", cellDates: false, codepage: cp || undefined });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) continue;
      const candidate = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1, raw: true, defval: null, blankrows: false,
      });
      if (findHeaderRow(candidate) !== -1) { matrix = candidate; break; }
      if (matrix.length === 0) matrix = candidate;
    }
    if (findHeaderRow(matrix) === -1) {
      const fixed = fixArabicEncoding(matrix);
      if (findHeaderRow(fixed) !== -1) matrix = fixed;
    }
  } catch (e) {
    return { ok: false, presentCodes: [], dates: [], rowsParsed: 0, headerFound: false, error: e instanceof Error ? e.message : "parse error" };
  }

  if (matrix.length === 0) {
    return { ok: false, presentCodes: [], dates: [], rowsParsed: 0, headerFound: false, error: "الملف فاضي" };
  }

  const headerRow = findHeaderRow(matrix);
  if (headerRow === -1) {
    return { ok: false, presentCodes: [], dates: [], rowsParsed: 0, headerFound: false, error: "ما لقيناش عمود «رقم البصمة/كود الموظف» في الملف — تأكد إنه كشف بصمة فيه عمود الكود." };
  }

  // Map column index → logical field.
  const header = matrix[headerRow];
  const col: Partial<Record<string, number>> = {};
  for (let c = 0; c < header.length; c += 1) {
    const field = lookupAlias(header[c]);
    if (field && col[field] === undefined) col[field] = c;
  }
  if (col.code === undefined) {
    return { ok: false, presentCodes: [], dates: [], rowsParsed: 0, headerFound: true, error: "ما لقيناش عمود كود الموظف/رقم البصمة في الكشف." };
  }
  const codeCol: number = col.code;
  // Typed locals so TS narrows them inside the loop (object props don't narrow
  // across function calls).
  const dateCol = col.date;
  const timeCol = col.time;
  const checkInCol = col.check_in;
  const checkOutCol = col.check_out;
  const statusCol = col.status;

  const present = new Set<string>();
  const dates = new Set<string>();
  const hasTimeCol =
    timeCol !== undefined || checkInCol !== undefined || checkOutCol !== undefined;
  const hasStatusCol = statusCol !== undefined;
  let rowsParsed = 0;

  for (let r = headerRow + 1; r < matrix.length; r += 1) {
    const row = matrix[r];
    if (!Array.isArray(row)) continue;
    const code = normalizeCode(row[codeCol]);
    if (!code) continue;
    rowsParsed += 1;

    if (dateCol !== undefined) {
      const d = normalizeDate(row[dateCol]);
      if (d) dates.add(d);
    }

    // Presence signal, in priority order.
    let isPresent = false;
    if (hasTimeCol) {
      isPresent =
        hasPunchTime(timeCol !== undefined ? row[timeCol] : null) ||
        hasPunchTime(checkInCol !== undefined ? row[checkInCol] : null) ||
        hasPunchTime(checkOutCol !== undefined ? row[checkOutCol] : null);
    }
    if (!isPresent && statusCol !== undefined) {
      const st = normalizeArabic(String(row[statusCol] ?? ""));
      if (st && PRESENT_STATUS.has(st)) isPresent = true;
    }
    // Fallback: a code+date log with no time/status columns at all — the mere
    // appearance of a punch row means the person was on the device that day.
    if (!isPresent && !hasTimeCol && !hasStatusCol) isPresent = true;

    if (isPresent) present.add(code);
  }

  return {
    ok: true,
    presentCodes: [...present],
    dates: [...dates].sort(),
    rowsParsed,
    headerFound: true,
  };
}
