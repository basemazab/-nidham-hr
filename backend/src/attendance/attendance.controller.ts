import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ZktecoImportService } from './zkteco-import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private zktecoService: ZktecoImportService,
  ) {}

  @Get('daily')
  @ApiOperation({ summary: 'الحضور اليومي' })
  getDailyAttendance(@Request() req: any, @Query('date') date: string) {
    return this.attendanceService.getDailyAttendance(req.user.companyId, date || new Date().toISOString().split('T')[0]);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'الحضور الشهري' })
  getMonthlyAttendance(
    @Request() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.attendanceService.getMonthlyAttendance(
      req.user.companyId,
      parseInt(month) || new Date().getMonth() + 1,
      parseInt(year) || new Date().getFullYear(),
    );
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'حضور موظف' })
  getEmployeeAttendance(
    @Param('employeeId') employeeId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.attendanceService.getEmployeeAttendance(
      employeeId,
      parseInt(month) || new Date().getMonth() + 1,
      parseInt(year) || new Date().getFullYear(),
    );
  }

  @Post('import/zkteco')
  @ApiOperation({ summary: 'استيراد بيانات ZKTeco' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async importZkteco(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    const content = file.buffer.toString('utf-8');
    const fileName = file.originalname.toLowerCase();

    let records;
    if (fileName.endsWith('.dat')) {
      records = this.zktecoService.parseDatFile(content);
    } else {
      records = this.zktecoService.parseExcelExport(content);
    }

    return this.zktecoService.importRecords(records, req.user.companyId);
  }

  @Put(':id/correct')
  @ApiOperation({ summary: 'تصحيح سجل حضور' })
  correctRecord(
    @Param('id') id: string,
    @Body() body: { checkIn?: string; checkOut?: string; notes?: string },
    @Request() req: any,
  ) {
    return this.attendanceService.manualCorrection(id, body, req.user.sub);
  }
}
