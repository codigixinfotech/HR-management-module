import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OvertimeService } from './overtime.service';
import { CreateManualOvertimeDto, CreateOvertimePolicyDto, UpdateOvertimeStatusDto } from './dto/overtime.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('attendance-leave/overtime')
export class OvertimeController {
  constructor(private readonly overtimeService: OvertimeService) {}

  @Get()
  @Permissions('attendance_leave.read')
  list(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.overtimeService.list(tenantCompanyId, status, from, to, search);
  }

  @Get('policies')
  @Permissions('attendance_leave.read')
  getPolicies(@Query('companyId') companyId?: string, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.overtimeService.getPolicies(tenantCompanyId);
  }

  @Post('policies')
  @Permissions('attendance_leave.write')
  createPolicy(@Body() dto: CreateOvertimePolicyDto, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.overtimeService.createPolicy({ ...dto, companyId: tenantCompanyId || dto.companyId });
  }

  @Patch('policies/:id/status')
  @Permissions('attendance_leave.write')
  updatePolicyStatus(@Param('id') id: string, @Body('status') status: 'Active' | 'Inactive') {
    return this.overtimeService.updatePolicyStatus(id, status);
  }


  @Get('wage-rate/:employeeId')
  @Permissions('attendance_leave.read')
  getWageRate(@Param('employeeId') employeeId: string) {
    return this.overtimeService.getEmployeeWageRate(employeeId);
  }

  @Post('sync')
  @Permissions('attendance_leave.write')
  sync(@Query('companyId') companyId?: string, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.overtimeService.syncAttendanceOvertime(tenantCompanyId);
  }

  @Post('manual')
  @Permissions('attendance_leave.write')
  createManual(
    @Body() dto: CreateManualOvertimeDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.overtimeService.createManual({ ...dto, companyId: tenantCompanyId || dto.companyId });
  }

  @Patch(':id/status')
  @Permissions('attendance_leave.write')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOvertimeStatusDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const approverName = user?.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`.trim()
      : user?.email?.split('@')[0] || 'Manager';
    return this.overtimeService.updateStatus(id, dto, approverName);
  }
}
