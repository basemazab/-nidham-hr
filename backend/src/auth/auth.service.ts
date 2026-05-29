import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        isActive: true,
      },
      include: {
        companies: { include: { company: true } },
        employee: true,
      },
    });

    if (!user) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    return user;
  }

  async login(user: any) {
    const defaultCompany = user.companies.find((uc: any) => uc.isDefault) || user.companies[0];

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyId: defaultCompany?.companyId,
      employeeId: user.employeeId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nameAr: user.nameAr,
        nameEn: user.nameEn,
        role: user.role,
        employeeId: user.employeeId,
        companies: user.companies.map((uc: any) => ({
          id: uc.company.id,
          nameAr: uc.company.nameAr,
          nameEn: uc.company.nameEn,
          isDefault: uc.isDefault,
        })),
        currentCompanyId: defaultCompany?.companyId,
      },
    };
  }

  async switchCompany(userId: string, companyId: string) {
    const userCompany = await this.prisma.userCompany.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    if (!userCompany) throw new UnauthorizedException('لا يمكنك الوصول لهذه الشركة');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companies: { include: { company: true } } },
    });

    const payload = {
      sub: userId,
      username: user.username,
      email: user.email,
      role: user.role,
      companyId,
      employeeId: user.employeeId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      currentCompanyId: companyId,
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        nameAr: true,
        nameEn: true,
        role: true,
        employeeId: true,
        companies: {
          include: { company: { select: { id: true, nameAr: true, nameEn: true, logoUrl: true } } },
        },
      },
    });
  }
}
