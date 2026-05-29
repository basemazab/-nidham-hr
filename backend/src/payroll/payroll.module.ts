import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PayrollCalculator } from './payroll-calculator.service';

@Module({
  controllers: [PayrollController],
  providers: [PayrollService, PayrollCalculator],
  exports: [PayrollService],
})
export class PayrollModule {}
