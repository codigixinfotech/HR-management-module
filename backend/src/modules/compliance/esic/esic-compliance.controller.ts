import { Controller, Get, Query } from '@nestjs/common';
import { EsicComplianceService } from './esic-compliance.service';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../../common/utils/tenant-context.util';

@Controller('compliance/esic')
export class EsicComplianceController {
  constructor(private readonly esicService: EsicComplianceService) {}

  @Get('register')
  async getRegister(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('period') period?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.esicService.getRegister(tenantCompanyId, period);
  }

  @Get('dashboard')
  async getDashboard(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('period') period?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.esicService.getDashboard(tenantCompanyId, period);
  }
}
