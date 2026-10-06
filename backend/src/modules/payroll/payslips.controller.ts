import { Controller, Get, Param, Query } from '@nestjs/common';
import { PayslipsService } from './payslips.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantBranchId, getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('payroll/payslips')
export class PayslipsController {
  constructor(private readonly payslipsService: PayslipsService) {}

  @Get()
  @Permissions('payroll.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('payrollRunId') payrollRunId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('companyId') queryCompanyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, queryCompanyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.payslipsService.list(payrollRunId, employeeId, tenantBranchId, tenantCompanyId);
  }

  @Get(':id')
  @Permissions('payroll.read')
  findOne(@Param('id') id: string) {
    return this.payslipsService.findById(id);
  }
}
