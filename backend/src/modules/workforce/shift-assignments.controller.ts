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
import { ShiftAssignmentsService } from './shift-assignments.service';
import {
  CreateShiftAssignmentDto,
  UpdateShiftAssignmentDto,
} from './dto/shift-assignment.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('workforce/shift-assignments')
export class ShiftAssignmentsController {
  constructor(
    private readonly shiftAssignmentsService: ShiftAssignmentsService,
  ) {}

  @Get()
  @Permissions('workforce.read')
  list(
    @Query('employeeId') employeeId?: string,
    @Query('shiftTypeId') shiftTypeId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.shiftAssignmentsService.list(employeeId, shiftTypeId, companyId);
  }

  @Get(':id')
  @Permissions('workforce.read')
  findOne(@Param('id') id: string) {
    return this.shiftAssignmentsService.findById(id);
  }

  @Post()
  @Permissions('workforce.write')
  create(@Body() dto: CreateShiftAssignmentDto) {
    return this.shiftAssignmentsService.create(dto);
  }

  @Patch(':id')
  @Permissions('workforce.write')
  update(@Param('id') id: string, @Body() dto: UpdateShiftAssignmentDto) {
    return this.shiftAssignmentsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('workforce.write')
  remove(@Param('id') id: string) {
    return this.shiftAssignmentsService.remove(id);
  }
}
