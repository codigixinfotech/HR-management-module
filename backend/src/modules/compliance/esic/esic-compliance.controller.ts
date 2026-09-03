import { Controller, Get, Query } from '@nestjs/common';
import { EsicComplianceService } from './esic-compliance.service';

@Controller('compliance/esic')
export class EsicComplianceController {
  constructor(private readonly esicService: EsicComplianceService) {}

  @Get('register')
  async getRegister(
    @Query('companyId') companyId?: string,
    @Query('period') period?: string,
  ) {
    return this.esicService.getRegister(companyId, period);
  }

  @Get('dashboard')
  async getDashboard(
    @Query('companyId') companyId?: string,
    @Query('period') period?: string,
  ) {
    return this.esicService.getDashboard(companyId, period);
  }
}
