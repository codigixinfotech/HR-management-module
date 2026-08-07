import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LeaveBalancesService } from './leave-balances.service';
import { AllocateLeaveBalanceDto } from './dto/leave-balance.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('attendance-leave/leave-balances')
export class LeaveBalancesController {
  constructor(private readonly leaveBalancesService: LeaveBalancesService) {}

  @Get()
  @Permissions('attendance_leave.read')
  list(@Query('employeeId') employeeId?: string, @Query('year') year?: string) {
    return this.leaveBalancesService.list(
      employeeId,
      year ? Number(year) : undefined,
    );
  }

  @Post()
  @Permissions('attendance_leave.write')
  allocate(@Body() dto: AllocateLeaveBalanceDto) {
    return this.leaveBalancesService.allocate(dto);
  }
}
