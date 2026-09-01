import { Controller, Get, Post, Put, Delete, Body, Query, Param, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PfComplianceService } from './services/pf-compliance.service';
import { InitiatePfRunDto, UpdatePfConfigDto, RecordTrrnChallanDto, RecordPfPaymentDto, RecordEpfoSubmissionDto } from './dto/pf-compliance.dto';

@Controller('compliance/pf')
export class PfComplianceController {
  constructor(private readonly pfService: PfComplianceService) {}

  @Get('dashboard')
  async getDashboardData(
    @Query('period') period?: string,
    @Query('companyId') companyId?: string,
  ) {
    const targetPeriod = period || '2026-09';
    return this.pfService.getDashboardData(targetPeriod, companyId);
  }

  @Get('employees')
  async getEmployees(@Query('companyId') companyId?: string) {
    return this.pfService.getPfEmployeeRegister(companyId);
  }

  @Post('employees/sync')
  async syncEmployees(@Query('companyId') companyId?: string) {
    return this.pfService.syncEmployeesWithPf(companyId);
  }

  @Get('configuration')
  async getConfig(@Query('companyId') companyId: string) {
    return this.pfService.getOrCreateConfig(companyId || 'default-company');
  }

  @Put('configuration')
  async updateConfig(@Body() dto: UpdatePfConfigDto) {
    return this.pfService.updateConfig(dto);
  }

  @Delete('configuration')
  async resetConfig(@Query('companyId') companyId: string) {
    return this.pfService.resetConfig(companyId);
  }

  @Delete('configuration/versions/:versionId')
  async deleteVersion(
    @Param('versionId') versionId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.pfService.deleteVersionLog(companyId, versionId);
  }

  @Post('runs/initiate')
  async initiateRun(@Body() dto: InitiatePfRunDto) {
    return this.pfService.initiateRun(dto.companyId, dto.period);
  }

  @Post('runs/:id/calculate')
  async calculateRun(@Param('id') id: string) {
    return this.pfService.calculateRun(id);
  }

  @Post('runs/:id/validate')
  async validateRun(@Param('id') id: string) {
    return this.pfService.validateRun(id);
  }

  @Post('runs/:id/ecr/generate')
  async generateEcr(@Param('id') id: string) {
    return this.pfService.generateEcr(id);
  }

  @Get('runs/:id/ecr/download')
  async downloadEcr(@Param('id') id: string, @Res() res: Response) {
    const ecr = await this.pfService.generateEcr(id);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${ecr.fileName}"`);
    return res.status(HttpStatus.OK).send(ecr.fileContent);
  }

  @Post('runs/challan')
  async recordTrrnChallan(@Body() dto: RecordTrrnChallanDto) {
    return this.pfService.recordTrrnChallan(dto);
  }

  @Post('runs/payment')
  async recordPayment(@Body() dto: RecordPfPaymentDto) {
    return this.pfService.recordPayment(dto);
  }

  @Post('runs/submission')
  async recordEpfoSubmission(@Body() dto: RecordEpfoSubmissionDto) {
    return this.pfService.recordEpfoSubmission(dto);
  }

  @Post('runs/:id/reconcile')
  async executeReconciliation(@Param('id') id: string) {
    return this.pfService.executeFiveWayReconciliation(id);
  }
}
