import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { ZktecoImportService } from './zkteco-import.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, ZktecoImportService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
