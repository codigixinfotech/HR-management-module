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
import { OvertimeController } from './overtime.controller';
import { OvertimeService } from './overtime.service';

@Module({
  controllers: [
    LeaveTypesController,
    HolidaysController,
    LeaveBalancesController,
    LeaveRequestsController,
    AttendanceController,
    OvertimeController,
  ],
  providers: [
    LeaveTypesService,
    HolidaysService,
    LeaveBalancesService,
    LeaveRequestsService,
    AttendanceService,
    OvertimeService,
  ],
  exports: [
    LeaveTypesService,
    HolidaysService,
    LeaveBalancesService,
    LeaveRequestsService,
    AttendanceService,
    OvertimeService,
  ],
})
export class AttendanceLeaveModule {}
