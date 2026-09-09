import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('attendance-leave/leave-types')
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Get()
  @Permissions('attendance_leave.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.leaveTypesService.list(tenantCompanyId);
  }

  @Get(':id')
  @Permissions('attendance_leave.read')
  findOne(@Param('id') id: string) {
    return this.leaveTypesService.findById(id);
  }

  @Post()
  @Permissions('attendance_leave.write')
  create(@Body() dto: CreateLeaveTypeDto) {
    return this.leaveTypesService.create(dto);
  }

  @Patch(':id')
  @Permissions('attendance_leave.write')
  update(@Param('id') id: string, @Body() dto: UpdateLeaveTypeDto) {
    return this.leaveTypesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('attendance_leave.write')
  remove(@Param('id') id: string) {
    return this.leaveTypesService.remove(id);
  }
}
