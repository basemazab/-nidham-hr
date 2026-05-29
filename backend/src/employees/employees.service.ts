import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string, filters?: { factoryId?: string; departmentId?: string; category?: string; status?: string }) {
    const where: any = { companyId };
    if (filters?.factoryId) where.factoryId = filters.factoryId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;

    return this.prisma.employee.findMany({
      where,
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
        factory: { select: { nameAr: true, nameEn: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        company: { select: { nameAr: true, nameEn: true } },
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
        factory: { select: { nameAr: true, nameEn: true } },
        documents: true,
        leaveBalances: true,
        loans: { where: { status: 'ACTIVE' } },
      },
    });
    if (!employee) throw new NotFoundException('الموظف غير موجود');
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    const code = await this.generateEmployeeCode(dto.companyId);
    return this.prisma.employee.create({
      data: { ...dto, employeeCode: code },
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    return this.prisma.employee.update({
      where: { id },
      data: dto,
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });
  }

  async getStats(companyId: string) {
    const [total, active, byCategory, byDepartment] = await Promise.all([
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
    ]);

    return { total, active, byCategory, byDepartment };
  }

  private async generateEmployeeCode(companyId: string): Promise<string> {
    const count = await this.prisma.employee.count({ where: { companyId } });
    return `EMP-${String(count + 1).padStart(4, '0')}`;
  }
}
