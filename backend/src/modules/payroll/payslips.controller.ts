import { Controller, Get, Param, Query } from '@nestjs/common';
import { PayslipsService } from './payslips.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('payroll/payslips')
export class PayslipsController {
  constructor(private readonly payslipsService: PayslipsService) {}

  @Get()
  @Permissions('payroll.read')
  list(
    @Query('payrollRunId') payrollRunId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.payslipsService.list(payrollRunId, employeeId);
  }

  @Get(':id')
  @Permissions('payroll.read')
  findOne(@Param('id') id: string) {
    return this.payslipsService.findById(id);
  }
}
