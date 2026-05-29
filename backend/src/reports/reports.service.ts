import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(companyId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const today = now.toISOString().split('T')[0];

    const [
      totalEmployees,
      activeEmployees,
      byCategory,
      byDepartment,
      todayAttendance,
      pendingLeaves,
      latestPayroll,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { companyId } }),
      this.prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      this.prisma.employee.groupBy({
        by: ['category'],
        where: { companyId, status: 'ACTIVE' },
        _count: true,
      }),
      this.prisma.employee.groupBy({
        by: ['departmentId'],
        where: { companyId, status: 'ACTIVE' },
        _count: true,
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { employee: { companyId }, date: new Date(today) },
        _count: true,
      }),
      this.prisma.leaveRequest.count({
        where: { employee: { companyId }, status: 'PENDING' },
      }),
      this.prisma.payrollRun.findFirst({
        where: { companyId, status: 'COMMITTED' },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        select: { month: true, year: true, totalGross: true, totalNet: true, totalTax: true },
      }),
    ]);

    // Get department names
    const departments = await this.prisma.department.findMany({
      where: { companyId },
      select: { id: true, nameAr: true, nameEn: true },
    });
    const deptMap = new Map(departments.map(d => [d.id, d]));

    return {
      headcount: { total: totalEmployees, active: activeEmployees },
      byCategory: byCategory.map(c => ({ category: c.category, count: c._count })),
      byDepartment: byDepartment.map(d => ({
        department: deptMap.get(d.departmentId),
        count: d._count,
      })),
      todayAttendance: todayAttendance.map(a => ({ status: a.status, count: a._count })),
      pendingLeaves,
      latestPayroll,
    };
  }

  async getMonthlyHeadcountTrend(companyId: string, months: number = 12) {
    const results = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = await this.prisma.employee.count({
        where: {
          companyId,
          hireDate: { lte: date },
          OR: [
            { status: 'ACTIVE' },
            { status: 'ON_LEAVE' },
          ],
        },
      });
      results.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        count,
      });
    }

    return results;
  }

  async getPayrollCostTrend(companyId: string) {
    return this.prisma.payrollRun.findMany({
      where: { companyId, status: 'COMMITTED' },
      select: { month: true, year: true, totalGross: true, totalNet: true, totalTax: true, totalSocialInsuranceEmployee: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      take: 12,
    });
  }
}
