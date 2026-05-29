import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Egyptian Labor Law No. 12/2003 - Leave Entitlements:
 * - Annual leave: 21 days (< 10 yrs service), 30 days (≥ 10 yrs or > 50 yrs old)
 * - Casual leave: 6 days/year (max 2 consecutive)
 * - Sick leave: Per medical certificate, Social Insurance rules
 * - Maternity: 4 months (max 3 deliveries during service)
 * - Hajj: 1 month, paid, once during service
 * - Marriage: 3 days
 * - Bereavement: 3 days
 * - Exam: As needed with notice
 */

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  calculateAnnualEntitlement(hireDate: Date, dateOfBirth: Date, year: number): number {
    const serviceYears = year - hireDate.getFullYear();
    const age = year - dateOfBirth.getFullYear();
    if (serviceYears >= 10 || age > 50) return 30;
    return 21;
  }

  async initializeBalances(employeeId: string, year: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException('الموظف غير موجود');

    const annualDays = this.calculateAnnualEntitlement(employee.hireDate, employee.dateOfBirth, year);

    // Get previous year carry-over
    const prevBalance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_leaveType_year: { employeeId, leaveType: 'ANNUAL', year: year - 1 } },
    });
    const carryOver = prevBalance ? Number(prevBalance.remaining) : 0;

    const leaveTypes = [
      { type: 'ANNUAL' as const, entitled: annualDays, carriedOver: Math.min(carryOver, annualDays) },
      { type: 'CASUAL' as const, entitled: 6, carriedOver: 0 },
      { type: 'SICK' as const, entitled: 90, carriedOver: 0 },
    ];

    const balances: any[] = [];
    for (const lt of leaveTypes) {
      const balance = await this.prisma.leaveBalance.upsert({
        where: { employeeId_leaveType_year: { employeeId, leaveType: lt.type, year } },
        create: {
          employeeId,
          leaveType: lt.type,
          year,
          entitled: lt.entitled,
          carriedOver: lt.carriedOver,
          remaining: lt.entitled + lt.carriedOver,
          used: 0,
        },
        update: {},
      });
      balances.push(balance);
    }

    return balances;
  }

  async getBalances(employeeId: string, year: number) {
    let balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
    });

    if (balances.length === 0) {
      balances = await this.initializeBalances(employeeId, year);
    }

    return balances;
  }

  async createRequest(data: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Validate casual leave (max 2 consecutive)
    if (data.leaveType === 'CASUAL' && days > 2) {
      throw new BadRequestException('الإجازة العارضة لا تزيد عن يومين متتاليين');
    }

    // Check balance
    const year = start.getFullYear();
    const balances = await this.getBalances(data.employeeId, year);
    const balance = balances.find(b => b.leaveType === data.leaveType);

    if (balance && Number(balance.remaining) < days) {
      throw new BadRequestException(`الرصيد المتاح ${balance.remaining} يوم فقط`);
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId: data.employeeId,
        leaveType: data.leaveType as any,
        startDate: start,
        endDate: end,
        days,
        reason: data.reason,
        status: 'PENDING',
      },
      include: {
        employee: { select: { nameAr: true, nameEn: true, employeeCode: true } },
      },
    });
  }

  async approveRequest(requestId: string, approvedBy: string, comment?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('طلب الإجازة غير موجود');

    const updatedRequest = await this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: 'HR_APPROVED',
        approvedBy,
        approvedAt: new Date(),
        hrComment: comment,
      },
    });

    // Update balance
    const year = request.startDate.getFullYear();
    await this.prisma.leaveBalance.update({
      where: {
        employeeId_leaveType_year: {
          employeeId: request.employeeId,
          leaveType: request.leaveType,
          year,
        },
      },
      data: {
        used: { increment: Number(request.days) },
        remaining: { decrement: Number(request.days) },
      },
    });

    // Create attendance records for leave days
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      await this.prisma.attendanceRecord.upsert({
        where: {
          employeeId_date: {
            employeeId: request.employeeId,
            date: new Date(d),
          },
        },
        create: {
          employeeId: request.employeeId,
          date: new Date(d),
          status: 'ON_LEAVE',
          source: 'leave',
        },
        update: {
          status: 'ON_LEAVE',
          source: 'leave',
        },
      });
    }

    return updatedRequest;
  }

  async rejectRequest(requestId: string, comment: string) {
    return this.prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', hrComment: comment },
    });
  }

  async getRequests(companyId: string, filters?: { status?: string; employeeId?: string }) {
    const where: any = { employee: { companyId } };
    if (filters?.status) where.status = filters.status;
    if (filters?.employeeId) where.employeeId = filters.employeeId;

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { employeeCode: true, nameAr: true, nameEn: true, department: { select: { nameAr: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
