import { Controller, Get, Query } from '@nestjs/common';
import { ReportsComplianceService } from './reports-compliance.service';

@Controller('compliance/reports')
export class ReportsComplianceController {
  constructor(private readonly reportsService: ReportsComplianceService) {}

  @Get('analytics')
  async getAnalytics(
    @Query('companyId') companyId?: string,
    @Query('period') period: string = '2026-09',
    @Query('fy') fy: string = '2026-2027',
  ) {
    return this.reportsService.getAnalytics(companyId, period, fy);
  }
}
