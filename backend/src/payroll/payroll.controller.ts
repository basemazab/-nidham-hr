import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private payrollService: PayrollService) {}

  @Get('runs')
  @ApiOperation({ summary: 'جميع مسيرات الرواتب' })
  getRuns(@Request() req: any) {
    return this.payrollService.getPayrollRuns(req.user.companyId);
  }

  @Post('runs')
  @ApiOperation({ summary: 'إنشاء مسير رواتب جديد' })
  createRun(@Request() req: any, @Body() body: { month: number; year: number }) {
    return this.payrollService.createPayrollRun(req.user.companyId, body.month, body.year);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'تفاصيل مسير الرواتب' })
  getRunDetails(@Param('id') id: string) {
    return this.payrollService.getPayrollRunDetails(id);
  }

  @Post('runs/:id/preview')
  @ApiOperation({ summary: 'معاينة مسير الرواتب' })
  previewRun(@Param('id') id: string) {
    return this.payrollService.previewPayroll(id);
  }

  @Post('runs/:id/commit')
  @ApiOperation({ summary: 'اعتماد مسير الرواتب' })
  commitRun(@Param('id') id: string, @Request() req: any) {
    return this.payrollService.commitPayroll(id, req.user.sub);
  }

  @Get('runs/:runId/payslip/:employeeId')
  @ApiOperation({ summary: 'مفردات مرتب موظف' })
  getPayslip(@Param('runId') runId: string, @Param('employeeId') employeeId: string) {
    return this.payrollService.getPayslip(runId, employeeId);
  }
}
