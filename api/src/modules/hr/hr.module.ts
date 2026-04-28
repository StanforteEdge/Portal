import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { PoliciesModule } from '../policies/policies.module';

@Module({
  imports: [PoliciesModule],
  controllers: [HrController, AttendanceController],
  providers: [HrService, AttendanceService]
})
export class HrModule {}
