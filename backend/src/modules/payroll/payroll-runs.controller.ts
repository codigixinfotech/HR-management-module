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
import { PayrollRunsService } from './payroll-runs.service';
import {
  CreatePayrollRunDto,
  UpdatePayrollRunStatusDto,
} from './dto/payroll-run.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('payroll/runs')
export class PayrollRunsController {
  constructor(private readonly payrollRunsService: PayrollRunsService) {}

  @Get()
  @Permissions('payroll.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.payrollRunsService.list(tenantCompanyId);
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

  @Delete(':id')
  @Permissions('payroll.write')
  remove(@Param('id') id: string) {
    return this.payrollRunsService.remove(id);
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

  @Get(':id/pre-run-checklist')
  @Permissions('payroll.read')
  getDiagnostics(@Param('id') id: string) {
    return this.payrollRunsService.getDiagnostics(id);
  }

  @Get(':id/attendance-lop')
  @Permissions('payroll.read')
  getAttendanceLop(@Param('id') id: string) {
    return this.payrollRunsService.getAttendanceLop(id);
  }

  @Get(':id/variable-inputs')
  @Permissions('payroll.read')
  getVariableInputs(@Param('id') id: string) {
    return this.payrollRunsService.getVariableInputs(id);
  }

  @Get(':id/fnf-records')
  @Permissions('payroll.read')
  getFnfRecords(@Param('id') id: string) {
    return this.payrollRunsService.getFnfRecords(id);
  }
}
