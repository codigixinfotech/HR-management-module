import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LeaveBalancesService } from './leave-balances.service';
import { AllocateLeaveBalanceDto } from './dto/leave-balance.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('attendance-leave/leave-balances')
export class LeaveBalancesController {
  constructor(private readonly leaveBalancesService: LeaveBalancesService) {}

  @Get()
  @Permissions('attendance_leave.read')
  list(
    @Query('employeeId') employeeId?: string,
    @Query('year') year?: string,
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.leaveBalancesService.list(
      employeeId,
      year ? Number(year) : undefined,
      tenantCompanyId,
    );
  }

  @Get('my')
  @Permissions('attendance_leave.read')
  listMy(@Query('year') year?: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.leaveBalancesService.listMy(
      user,
      year ? Number(year) : undefined,
    );
  }

  @Post()
  @Permissions('attendance_leave.write')
  allocate(@Body() dto: AllocateLeaveBalanceDto, @CurrentUser() user?: CurrentUserPayload) {
    return this.leaveBalancesService.allocate(dto, user);
  }
}

