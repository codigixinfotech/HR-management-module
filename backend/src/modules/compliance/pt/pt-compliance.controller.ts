import { Controller, Get, Query } from '@nestjs/common';
import { PtComplianceService } from './pt-compliance.service';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../../common/utils/tenant-context.util';

@Controller('compliance/pt')
export class PtComplianceController {
  constructor(private readonly ptService: PtComplianceService) {}

  @Get('dashboard')
  async getDashboard(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('period') period?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.ptService.getDashboard(tenantCompanyId, period);
  }

  @Get('register')
  async getRegister(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('period') period?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.ptService.getRegister(tenantCompanyId, period);
  }
}
