import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async getDailyAttendance(companyId: string, date: string) {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: { id: true, employeeCode: true, nameAr: true, nameEn: true, category: true },
    });

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        employee: { companyId },
        date: new Date(date),
      },
      include: {
        employee: { select: { employeeCode: true, nameAr: true, nameEn: true } },
      },
    });

    const recordMap = new Map(records.map(r => [r.employeeId, r]));
    const summary = {
      total: employees.length,
      present: 0,
      absent: 0,
      late: 0,
      earlyLeave: 0,
      onLeave: 0,
    };

    const result = employees.map(emp => {
      const record = recordMap.get(emp.id);
      if (record) {
        if (record.status === 'PRESENT') summary.present++;
        else if (record.status === 'ABSENT') summary.absent++;
        else if (record.status === 'LATE') { summary.late++; summary.present++; }
        else if (record.status === 'EARLY_LEAVE') { summary.earlyLeave++; summary.present++; }
        else if (record.status === 'ON_LEAVE') summary.onLeave++;
      } else {
        summary.absent++;
      }
      return { employee: emp, record };
    });

    return { date, summary, records: result };
  }

  async getMonthlyAttendance(companyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        employee: { companyId },
        date: { gte: startDate, lte: endDate },
      },
      include: {
        employee: { select: { employeeCode: true, nameAr: true, nameEn: true } },
      },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { date: 'asc' }],
    });

    return records;
  }

  async getEmployeeAttendance(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async manualCorrection(recordId: string, data: { checkIn?: string; checkOut?: string; notes?: string }, approvedBy: string) {
    const record = await this.prisma.attendanceRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundException('سجل الحضور غير موجود');

    return this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        checkIn: data.checkIn ? new Date(data.checkIn) : record.checkIn,
        checkOut: data.checkOut ? new Date(data.checkOut) : record.checkOut,
        isManualCorrection: true,
        correctionApprovedBy: approvedBy,
        notes: data.notes,
      },
    });
  }
}
