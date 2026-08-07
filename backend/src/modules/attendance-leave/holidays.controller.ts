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

@Controller('attendance-leave/holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get()
  @Permissions('attendance_leave.read')
  list(@Query('companyId') companyId?: string, @Query('year') year?: string) {
    return this.holidaysService.list(
      companyId,
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
