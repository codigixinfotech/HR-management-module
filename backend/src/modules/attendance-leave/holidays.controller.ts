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
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('attendance-leave/holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  @Permissions('attendance_leave.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('year') year?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.holidaysService.list(
      tenantCompanyId,
      year ? Number(year) : undefined,
    );
  }

  @Get(':id')
  @Permissions('attendance_leave.read')
  findOne(@Param('id') id: string) {
    return this.holidaysService.findById(id);
  }

  @Post()
  @Permissions('attendance_leave.write')
  create(@Body() dto: CreateHolidayDto) {
    return this.holidaysService.create(dto);
  }

  @Patch(':id')
  @Permissions('attendance_leave.write')
  update(@Param('id') id: string, @Body() dto: UpdateHolidayDto) {
    return this.holidaysService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('attendance_leave.write')
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
