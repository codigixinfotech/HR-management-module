import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { SalaryAssignmentsService } from './salary-assignments.service';
import { CreateSalaryAssignmentDto, UpdateSalaryAssignmentDto } from './dto/salary-assignment.dto';

@Controller('payroll/salary-assignments')
export class SalaryAssignmentsController {
  constructor(private readonly service: SalaryAssignmentsService) {}

  @Get()
  list(
    @Query('companyId') companyId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.list(companyId, employeeId, status);
  }

  @Get('revisions')
  listRevisions(@Query('companyId') companyId?: string) {
    return this.service.listRevisions(companyId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  assign(@Body() dto: CreateSalaryAssignmentDto) {
    return this.service.assign(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSalaryAssignmentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
