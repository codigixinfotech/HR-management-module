import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PayrollRunsService } from './payroll-runs.service';
import {
  CreatePayrollRunDto,
  UpdatePayrollRunStatusDto,
} from './dto/payroll-run.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('payroll/runs')
export class PayrollRunsController {
  constructor(private readonly payrollRunsService: PayrollRunsService) {}

  @Get()
  @Permissions('payroll.read')
  list(@Query('companyId') companyId?: string) {
    return this.payrollRunsService.list(companyId);
  }

  @Get(':id')
  @Permissions('payroll.read')
  findOne(@Param('id') id: string) {
    return this.payrollRunsService.findById(id);
  }

  @Post()
  @Permissions('payroll.write')
  create(@Body() dto: CreatePayrollRunDto) {
    return this.payrollRunsService.create(dto);
  }

  @Post(':id/process')
  @Permissions('payroll.write')
  process(@Param('id') id: string) {
    return this.payrollRunsService.process(id);
  }

  @Patch(':id/status')
  @Permissions('payroll.write')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePayrollRunStatusDto,
  ) {
    return this.payrollRunsService.updateStatus(id, dto);
  }
}
