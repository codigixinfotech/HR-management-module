import { Controller, Get, Query } from '@nestjs/common';
import { PtComplianceService } from './pt-compliance.service';

@Controller('compliance/pt')
export class PtComplianceController {
  constructor(private readonly ptService: PtComplianceService) {}

  @Get('dashboard')
  async getDashboard(
    @Query('companyId') companyId?: string,
    @Query('period') period?: string,
  ) {
    return this.ptService.getDashboard(companyId, period);
  }

  @Get('register')
  async getRegister(
    @Query('companyId') companyId?: string,
    @Query('period') period?: string,
  ) {
    return this.ptService.getRegister(companyId, period);
  }
}
