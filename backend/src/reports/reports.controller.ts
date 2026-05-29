import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'لوحة المعلومات' })
  getDashboard(@Request() req: any) {
    return this.reportsService.getDashboardStats(req.user.companyId);
  }

  @Get('headcount-trend')
  @ApiOperation({ summary: 'تطور عدد الموظفين' })
  getHeadcountTrend(@Request() req: any, @Query('months') months?: string) {
    return this.reportsService.getMonthlyHeadcountTrend(req.user.companyId, parseInt(months) || 12);
  }

  @Get('payroll-cost-trend')
  @ApiOperation({ summary: 'تطور تكلفة الرواتب' })
  getPayrollCostTrend(@Request() req: any) {
    return this.reportsService.getPayrollCostTrend(req.user.companyId);
  }
}
