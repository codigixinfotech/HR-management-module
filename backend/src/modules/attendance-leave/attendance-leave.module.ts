import { Module } from '@nestjs/common';
import { LeaveTypesController } from './leave-types.controller';
import { LeaveTypesService } from './leave-types.service';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './holidays.service';
import { LeaveBalancesController } from './leave-balances.controller';
import { LeaveBalancesService } from './leave-balances.service';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequestsService } from './leave-requests.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [
    LeaveTypesController,
    HolidaysController,
    LeaveBalancesController,
    LeaveRequestsController,
    AttendanceController,
  ],
  providers: [
    LeaveTypesService,
    HolidaysService,
    LeaveBalancesService,
    LeaveRequestsService,
    AttendanceService,
  ],
  exports: [
    LeaveTypesService,
    HolidaysService,
    LeaveBalancesService,
    LeaveRequestsService,
    AttendanceService,
  ],
})
export class AttendanceLeaveModule {}
