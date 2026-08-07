import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { SalaryStructureService } from './salary-structure.service';
import { AssignSalaryComponentDto } from './dto/employee-salary-component.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('payroll/salary-structure')
export class SalaryStructureController {
  constructor(
    private readonly salaryStructureService: SalaryStructureService,
  ) {}

  @Get()
  @Permissions('payroll.read')
  list(@Query('employeeId') employeeId: string) {
    return this.salaryStructureService.list(employeeId);
  }

  @Post()
  @Permissions('payroll.write')
  assign(@Body() dto: AssignSalaryComponentDto) {
    return this.salaryStructureService.assign(dto);
  }

  @Delete(':id')
  @Permissions('payroll.write')
  remove(@Param('id') id: string) {
    return this.salaryStructureService.remove(id);
  }
}
