import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollCalculator } from './payroll-calculator.service';

@Injectable()
export class PayrollService {
  constructor(
    private prisma: PrismaService,
    private calculator: PayrollCalculator,
  ) {}

  async createPayrollRun(companyId: string, month: number, year: number) {
    const existing = await this.prisma.payrollRun.findUnique({
      where: { companyId_month_year: { companyId, month, year } },
    });
    if (existing) throw new BadRequestException('يوجد بالفعل مسير رواتب لهذا الشهر');

    return this.prisma.payrollRun.create({
      data: { companyId, month, year, status: 'DRAFT' },
    });
  }

  async previewPayroll(runId: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: runId },
      include: { company: true },
    });
    if (!run) throw new NotFoundException('مسير الرواتب غير موجود');

    const employees = await this.prisma.employee.findMany({
      where: { companyId: run.companyId, status: 'ACTIVE' },
      include: { loans: { where: { status: 'ACTIVE' } } },
    });

    // Get allowance configs for this company
    const allowanceConfigs = await this.prisma.allowanceConfig.findMany({
      where: { companyId: run.companyId },
    });
    const configMap = new Map(allowanceConfigs.map(c => [c.category, c]));

    const startDate = new Date(run.year, run.month - 1, 1);
    const endDate = new Date(run.year, run.month, 0);

    const items = await Promise.all(
      employees.map(async (emp) => {
        // Get attendance data for the month
        const attendance = await this.prisma.attendanceRecord.findMany({
          where: {
            employeeId: emp.id,
            date: { gte: startDate, lte: endDate },
          },
        });

        const presentDays = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
        const absentDays = attendance.filter(a => a.status === 'ABSENT').length;
        const totalLateMinutes = attendance.reduce((sum, a) => sum + a.lateMinutes, 0);
        const totalOvertimeMinutes = attendance.reduce((sum, a) => sum + a.overtimeMinutes, 0);
        const totalWorkedHours = attendance.reduce((sum, a) => sum + Number(a.workedHours), 0);

        const config = configMap.get(emp.category);
        const loanDeduction = emp.loans.reduce((sum, loan) => sum + Number(loan.monthlyInstallment), 0);

        const result = this.calculator.calculate({
          category: emp.category as any,
          basicSalary: Number(emp.basicSalary),
          insurableSalary: Number(emp.insurableSalary),
          hourlyRate: emp.hourlyRate ? Number(emp.hourlyRate) : undefined,
          workedDays: presentDays,
          workedHours: totalWorkedHours,
          overtimeMinutes: totalOvertimeMinutes,
          lateMinutes: totalLateMinutes,
          absentDays,
          transportAllowance: config ? Number(config.transportAllowance) : 0,
          mealAllowance: config ? Number(config.mealAllowance) : 0,
          housingAllowance: config ? Number(config.housingAllowance) : 0,
          performanceBonus: 0,
          loanDeduction,
          advanceDeduction: 0,
          otherDeductions: 0,
        });

        return {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          nameAr: emp.nameAr,
          nameEn: emp.nameEn,
          category: emp.category,
          ...result,
        };
      }),
    );

    return { run, items };
  }

  async commitPayroll(runId: string, userId: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: runId },
    });
    if (!run) throw new NotFoundException('مسير الرواتب غير موجود');
    if (run.status === 'COMMITTED' || run.status === 'PAID') {
      throw new BadRequestException('مسير الرواتب مغلق بالفعل');
    }

    const preview = await this.previewPayroll(runId);

    // Delete existing items if re-committing
    await this.prisma.payrollItem.deleteMany({ where: { payrollRunId: runId } });

    // Create payroll items
    const items = await this.prisma.$transaction(
      preview.items.map((item) =>
        this.prisma.payrollItem.create({
          data: {
            payrollRunId: runId,
            employeeId: item.employeeId,
            basicSalary: item.basicSalary,
            workedDays: item.workedDays,
            workedHours: item.workedHours,
            transportAllowance: item.transportAllowance,
            mealAllowance: item.mealAllowance,
            housingAllowance: item.housingAllowance,
            performanceBonus: item.performanceBonus,
            overtimePay: item.overtimePay,
            otherEarnings: item.otherEarnings,
            grossSalary: item.grossSalary,
            socialInsuranceEmployee: item.socialInsuranceEmployee,
            socialInsuranceEmployer: item.socialInsuranceEmployer,
            incomeTax: item.incomeTax,
            loanDeduction: item.loanDeduction,
            advanceDeduction: item.advanceDeduction,
            absenceDeduction: item.absenceDeduction,
            lateDeduction: item.lateDeduction,
            otherDeductions: item.otherDeductions,
            totalDeductions: item.totalDeductions,
            netSalary: item.netSalary,
            annualGross: item.annualGross,
            annualSI: item.annualSI,
            annualTaxable: item.annualTaxable,
            annualTax: item.annualTax,
          },
        }),
      ),
    );

    // Update loan balances
    for (const item of preview.items) {
      if (item.loanDeduction > 0) {
        const emp = await this.prisma.employee.findUnique({
          where: { id: item.employeeId },
          include: { loans: { where: { status: 'ACTIVE' } } },
        });
        for (const loan of emp.loans) {
          const installment = Number(loan.monthlyInstallment);
          const newBalance = Number(loan.remainingBalance) - installment;
          const newPaid = loan.paidInstallments + 1;
          await this.prisma.loan.update({
            where: { id: loan.id },
            data: {
              paidInstallments: newPaid,
              remainingBalance: Math.max(0, newBalance),
              status: newPaid >= loan.totalInstallments ? 'PAID_OFF' : 'ACTIVE',
            },
          });
        }
      }
    }

    // Update run totals
    const totals = preview.items.reduce(
      (acc, item) => ({
        totalGross: acc.totalGross + item.grossSalary,
        totalNet: acc.totalNet + item.netSalary,
        totalSIEmployee: acc.totalSIEmployee + item.socialInsuranceEmployee,
        totalSIEmployer: acc.totalSIEmployer + item.socialInsuranceEmployer,
        totalTax: acc.totalTax + item.incomeTax,
      }),
      { totalGross: 0, totalNet: 0, totalSIEmployee: 0, totalSIEmployer: 0, totalTax: 0 },
    );

    await this.prisma.payrollRun.update({
      where: { id: runId },
      data: {
        status: 'COMMITTED',
        totalGross: totals.totalGross,
        totalNet: totals.totalNet,
        totalSocialInsuranceEmployee: totals.totalSIEmployee,
        totalSocialInsuranceEmployer: totals.totalSIEmployer,
        totalTax: totals.totalTax,
        processedBy: userId,
        committedAt: new Date(),
      },
    });

    return { run: { ...run, status: 'COMMITTED' }, itemCount: items.length, totals };
  }

  async getPayrollRuns(companyId: string) {
    return this.prisma.payrollRun.findMany({
      where: { companyId },
      include: { _count: { select: { items: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getPayrollRunDetails(runId: string) {
    return this.prisma.payrollRun.findUnique({
      where: { id: runId },
      include: {
        items: {
          include: {
            employee: {
              select: { employeeCode: true, nameAr: true, nameEn: true, category: true },
            },
          },
          orderBy: { employee: { employeeCode: 'asc' } },
        },
      },
    });
  }

  async getPayslip(runId: string, employeeId: string) {
    const item = await this.prisma.payrollItem.findUnique({
      where: { payrollRunId_employeeId: { payrollRunId: runId, employeeId } },
      include: {
        employee: {
          include: {
            company: true,
            department: true,
            position: true,
          },
        },
        payrollRun: true,
      },
    });
    if (!item) throw new NotFoundException('بيانات المرتب غير موجودة');
    return item;
  }
}
