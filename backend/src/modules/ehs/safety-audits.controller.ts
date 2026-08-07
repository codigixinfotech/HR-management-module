import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SafetyAuditsService } from './safety-audits.service';
import { CreateSafetyAuditDto } from './dto/safety-audit.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('ehs/audits')
export class SafetyAuditsController {
  constructor(private readonly safetyAuditsService: SafetyAuditsService) {}

  @Get()
  @Permissions('ehs.read')
  list(@Query('companyId') companyId?: string) {
    return this.safetyAuditsService.list(companyId);
  }

  @Post()
  @Permissions('ehs.write')
  create(@Body() dto: CreateSafetyAuditDto) {
    return this.safetyAuditsService.create(dto);
  }
}
