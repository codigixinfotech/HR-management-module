import { Controller, Get, Query } from '@nestjs/common';
import { TdsComplianceService } from './tds-compliance.service';

@Controller('compliance/tds')
export class TdsComplianceController {
  constructor(private readonly tdsService: TdsComplianceService) {}

  @Get('register')
  async getRegister(
    @Query('companyId') companyId?: string,
    @Query('quarter') quarter: string = 'Q2',
    @Query('fy') fy: string = '2026-2027',
  ) {
    return this.tdsService.getRegister(companyId, quarter, fy);
  }

  @Get('dashboard')
  async getDashboard(
    @Query('companyId') companyId?: string,
    @Query('quarter') quarter: string = 'Q2',
    @Query('fy') fy: string = '2026-2027',
  ) {
    return this.tdsService.getDashboard(companyId, quarter, fy);
  }
}
