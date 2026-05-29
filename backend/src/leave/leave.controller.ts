import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leave')
export class LeaveController {
  constructor(private leaveService: LeaveService) {}

  @Get('balances/:employeeId')
  @ApiOperation({ summary: 'رصيد إجازات الموظف' })
  getBalances(@Param('employeeId') employeeId: string, @Query('year') year: string) {
    return this.leaveService.getBalances(employeeId, parseInt(year) || new Date().getFullYear());
  }

  @Get('requests')
  @ApiOperation({ summary: 'طلبات الإجازات' })
  getRequests(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.leaveService.getRequests(req.user.companyId, { status, employeeId });
  }

  @Post('requests')
  @ApiOperation({ summary: 'تقديم طلب إجازة' })
  createRequest(@Body() body: { employeeId: string; leaveType: string; startDate: string; endDate: string; reason?: string }) {
    return this.leaveService.createRequest(body);
  }

  @Post('requests/:id/approve')
  @ApiOperation({ summary: 'الموافقة على طلب إجازة' })
  approveRequest(@Param('id') id: string, @Request() req: any, @Body() body: { comment?: string }) {
    return this.leaveService.approveRequest(id, req.user.sub, body.comment);
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'رفض طلب إجازة' })
  rejectRequest(@Param('id') id: string, @Body() body: { comment: string }) {
    return this.leaveService.rejectRequest(id, body.comment);
  }
}
