import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto, CreateFactoryDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      include: { factories: true, _count: { select: { employees: true } } },
      orderBy: { nameAr: 'asc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        factories: true,
        departments: { include: { positions: true } },
        _count: { select: { employees: true } },
      },
    });
    if (!company) throw new NotFoundException('الشركة غير موجودة');
    return company;
  }

  async create(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: dto });
  }

  async update(id: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async createFactory(companyId: string, dto: CreateFactoryDto) {
    return this.prisma.factory.create({
      data: { ...dto, companyId },
    });
  }

  async getFactories(companyId: string) {
    return this.prisma.factory.findMany({
      where: { companyId },
      include: { _count: { select: { employees: true } } },
    });
  }

  async getDepartments(companyId: string) {
    return this.prisma.department.findMany({
      where: { companyId },
      include: { positions: true, _count: { select: { employees: true } } },
    });
  }

  async createDepartment(companyId: string, data: { nameAr: string; nameEn: string }) {
    return this.prisma.department.create({ data: { ...data, companyId } });
  }

  async createPosition(departmentId: string, data: { nameAr: string; nameEn: string }) {
    return this.prisma.position.create({ data: { ...data, departmentId } });
  }
}
