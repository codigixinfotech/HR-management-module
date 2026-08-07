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
import { ShiftTypesService } from './shift-types.service';
import { CreateShiftTypeDto, UpdateShiftTypeDto } from './dto/shift-type.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('workforce/shift-types')
export class ShiftTypesController {
  constructor(private readonly shiftTypesService: ShiftTypesService) {}

  @Get()
  @Permissions('workforce.read')
  list(@Query('companyId') companyId?: string) {
    return this.shiftTypesService.list(companyId);
  }

  @Get(':id')
  @Permissions('workforce.read')
  findOne(@Param('id') id: string) {
    return this.shiftTypesService.findById(id);
  }

  @Post()
  @Permissions('workforce.write')
  create(@Body() dto: CreateShiftTypeDto) {
    return this.shiftTypesService.create(dto);
  }

  @Patch(':id')
  @Permissions('workforce.write')
  update(@Param('id') id: string, @Body() dto: UpdateShiftTypeDto) {
    return this.shiftTypesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('workforce.write')
  remove(@Param('id') id: string) {
    return this.shiftTypesService.remove(id);
  }
}
