import { Controller, Get } from '@nestjs/common';
import { AiIntelligenceService } from './ai-intelligence.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('ai-intelligence')
export class AiIntelligenceController {
  constructor(private readonly aiIntelligenceService: AiIntelligenceService) {}

  @Get('status')
  @Permissions('ai_intelligence.read')
  getStatus() {
    return this.aiIntelligenceService.getStatus();
  }
}
