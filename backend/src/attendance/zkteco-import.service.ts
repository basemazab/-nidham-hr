import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ZktecoRecord {
  empCode: string;
  date: Date;
  time: string;
  type: 'IN' | 'OUT';
}

@Injectable()
export class ZktecoImportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Parse ZKTeco .dat file format:
   * Each line: EmpCode\tDate\tTime\tStatus\tVerify\tWorkCode
   * Example: 1\t2024-01-15\t08:05:23\t0\t1\t0
   */
  parseDatFile(content: string): ZktecoRecord[] {
    const lines = content.trim().split('\n');
    const records: ZktecoRecord[] = [];

    for (const line of lines) {
      const parts = line.trim().split('\t');
      if (parts.length < 4) continue;

      const empCode = parts[0].trim();
      const dateStr = parts[1].trim();
      const timeStr = parts[2].trim();
      const status = parseInt(parts[3].trim());

      if (!empCode || !dateStr || !timeStr) continue;

      records.push({
        empCode: `EMP-${empCode.padStart(4, '0')}`,
        date: new Date(dateStr),
        time: timeStr,
        type: status === 0 ? 'IN' : 'OUT',
      });
    }

    return records;
  }

  /**
   * Parse ZKTeco Excel export (tab-separated or CSV)
   */
  parseExcelExport(content: string): ZktecoRecord[] {
    const lines = content.trim().split('\n');
    const records: ZktecoRecord[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t]/);
      if (parts.length < 4) continue;

      const empCode = parts[0].trim().replace(/"/g, '');
      const dateStr = parts[1].trim().replace(/"/g, '');
      const timeStr = parts[2].trim().replace(/"/g, '');
      const status = parseInt(parts[3].trim().replace(/"/g, ''));

      if (!empCode || !dateStr || !timeStr) continue;

      const formattedCode = empCode.startsWith('EMP-')
        ? empCode
        : `EMP-${empCode.padStart(4, '0')}`;

      records.push({
        empCode: formattedCode,
        date: new Date(dateStr),
        time: timeStr,
        type: status === 0 ? 'IN' : 'OUT',
      });
    }

    return records;
  }

  async importRecords(records: ZktecoRecord[], companyId: string) {
    // Group by employee + date
    const grouped = new Map<string, ZktecoRecord[]>();
    for (const record of records) {
      const key = `${record.empCode}_${record.date.toISOString().split('T')[0]}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(record);
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const [key, dayRecords] of grouped) {
      const [empCode, dateStr] = key.split('_');

      const employee = await this.prisma.employee.findFirst({
        where: { employeeCode: empCode, companyId },
      });

      if (!employee) {
        skipped++;
        errors.push(`الموظف ${empCode} غير موجود`);
        continue;
      }

      // Get shift for this employee
      const shiftAssignment = await this.prisma.shiftAssignment.findFirst({
        where: {
          employeeId: employee.id,
          startDate: { lte: new Date(dateStr) },
          OR: [
            { endDate: null },
            { endDate: { gte: new Date(dateStr) } },
          ],
        },
        include: { shift: true },
      });

      const shift = shiftAssignment?.shift;
      const graceMinutes = shift?.graceMinutes || 5;
      const shiftStartTime = shift?.startTime || '08:00';
      const shiftEndTime = shift?.endTime || '17:00';

      // Find earliest IN and latest OUT
      const ins = dayRecords.filter(r => r.type === 'IN').sort((a, b) => a.time.localeCompare(b.time));
      const outs = dayRecords.filter(r => r.type === 'OUT').sort((a, b) => b.time.localeCompare(a.time));

      const checkIn = ins[0]?.time;
      const checkOut = outs[0]?.time;

      // Calculate late minutes
      let lateMinutes = 0;
      if (checkIn) {
        const [shiftH, shiftM] = shiftStartTime.split(':').map(Number);
        const [inH, inM] = checkIn.split(':').map(Number);
        const shiftMinutes = shiftH * 60 + shiftM;
        const inMinutes = inH * 60 + inM;
        const diff = inMinutes - shiftMinutes;
        if (diff > graceMinutes) lateMinutes = diff;
      }

      // Calculate early leave minutes
      let earlyLeaveMinutes = 0;
      if (checkOut) {
        const [shiftH, shiftM] = shiftEndTime.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        const shiftMinutes = shiftH * 60 + shiftM;
        const outMinutes = outH * 60 + outM;
        if (outMinutes < shiftMinutes) earlyLeaveMinutes = shiftMinutes - outMinutes;
      }

      // Calculate worked hours
      let workedHours = 0;
      if (checkIn && checkOut) {
        const [inH, inM] = checkIn.split(':').map(Number);
        const [outH, outM] = checkOut.split(':').map(Number);
        workedHours = (outH * 60 + outM - (inH * 60 + inM)) / 60;
        if (shift) workedHours = Math.max(0, workedHours - (shift.breakMinutes / 60));
      }

      // Calculate overtime
      let overtimeMinutes = 0;
      if (workedHours > 8) {
        overtimeMinutes = Math.round((workedHours - 8) * 60);
      }

      let status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' = 'PRESENT';
      if (!checkIn && !checkOut) status = 'ABSENT';
      else if (lateMinutes > 0) status = 'LATE';
      else if (earlyLeaveMinutes > 0) status = 'EARLY_LEAVE';

      const date = new Date(dateStr);

      try {
        await this.prisma.attendanceRecord.upsert({
          where: { employeeId_date: { employeeId: employee.id, date } },
          create: {
            employeeId: employee.id,
            date,
            checkIn: checkIn ? new Date(`${dateStr}T${checkIn}`) : null,
            checkOut: checkOut ? new Date(`${dateStr}T${checkOut}`) : null,
            status,
            lateMinutes,
            earlyLeaveMinutes,
            overtimeMinutes,
            workedHours,
            source: 'zkteco',
          },
          update: {
            checkIn: checkIn ? new Date(`${dateStr}T${checkIn}`) : null,
            checkOut: checkOut ? new Date(`${dateStr}T${checkOut}`) : null,
            status,
            lateMinutes,
            earlyLeaveMinutes,
            overtimeMinutes,
            workedHours,
            source: 'zkteco',
          },
        });
        imported++;
      } catch (err) {
        skipped++;
        errors.push(`خطأ في تسجيل ${empCode} بتاريخ ${dateStr}: ${err.message}`);
      }
    }

    return { imported, skipped, total: grouped.size, errors: errors.slice(0, 20) };
  }
}
