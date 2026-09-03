import { Controller, Get, Query } from '@nestjs/common';
import { LabourComplianceService } from './labour-compliance.service';

@Controller('compliance/labour')
export class LabourComplianceController {
  constructor(private readonly labourService: LabourComplianceService) {}

  @Get('dashboard')
  async getDashboard(
    @Query('companyId') companyId?: string,
    @Query('period') period: string = '2026-09',
    @Query('fy') fy: string = '2026-2027',
  ) {
    return this.labourService.getDashboard(companyId, period, fy);
  }
}
