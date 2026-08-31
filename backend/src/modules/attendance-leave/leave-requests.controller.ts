import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service';
import {
  CreateLeaveRequestDto,
  ListLeaveRequestsQueryDto,
  UpdateLeaveStatusDto,
} from './dto/leave-request.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

import { ApprovalStatus } from '@prisma/client';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('attendance-leave/leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Get()
  @Permissions('attendance_leave.read')
  list(@Query() query: ListLeaveRequestsQueryDto) {
    return this.leaveRequestsService.list(
      query,
      query.employeeId,
      query.status,
    );
  }

  @Get('my')
  @Permissions('attendance_leave.read')
  listMy(
    @Query('status') status?: ApprovalStatus,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.leaveRequestsService.listMy(user, status);
  }

  @Get(':id')
  @Permissions('attendance_leave.read')
  findOne(@Param('id') id: string) {
    return this.leaveRequestsService.findById(id);
  }

  @Post()
  @Permissions('attendance_leave.write')
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveRequestsService.create(dto);
  }

  @Patch(':id/status')
  @Permissions('attendance_leave.write')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateLeaveStatusDto) {
    return this.leaveRequestsService.updateStatus(id, dto);
  }
}
