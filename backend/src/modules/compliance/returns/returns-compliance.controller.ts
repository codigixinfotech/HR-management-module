import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ReturnsComplianceService, ReturnFilingDto } from './returns-compliance.service';

@Controller('compliance/returns')
export class ReturnsComplianceController {
  constructor(private readonly returnsService: ReturnsComplianceService) {}

  @Get('dashboard')
  async getDashboard(
    @Query('companyId') companyId?: string,
    @Query('period') period: string = '2026-09',
    @Query('fy') fy: string = '2026-2027',
  ) {
    return this.returnsService.getDashboard(companyId, period, fy);
  }

  @Post('file')
  async markFiling(
    @Query('companyId') companyId: string | undefined,
    @Body() dto: ReturnFilingDto,
  ) {
    return this.returnsService.markFiling(companyId, dto);
  }
}
