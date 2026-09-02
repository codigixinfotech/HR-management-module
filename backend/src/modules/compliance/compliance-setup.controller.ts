import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ComplianceSetupService } from './compliance-setup.service';
import { CreateComplianceSetupDto, UpdateComplianceSetupDto } from './dto/compliance-setup.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('compliance/setup')
export class ComplianceSetupController {
  constructor(private readonly setupService: ComplianceSetupService) {}

  @Get()
  @Permissions('compliance.read')
  getSetup(@Query('companyId') companyId?: string) {
    return this.setupService.getSetup(companyId);
  }

  @Get('history')
  @Permissions('compliance.read')
  getHistory(@Query('companyId') companyId?: string) {
    return this.setupService.getHistory(companyId);
  }

  @Post()
  @Permissions('compliance.write')
  createSetup(@Body() dto: CreateComplianceSetupDto) {
    return this.setupService.createSetup(dto);
  }

  @Put(':id')
  @Permissions('compliance.write')
  updateSetup(@Param('id') id: string, @Body() dto: UpdateComplianceSetupDto) {
    return this.setupService.updateSetup(id, dto);
  }
}
