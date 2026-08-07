import { Module } from '@nestjs/common';
import { AiIntelligenceController } from './ai-intelligence.controller';
import { AiIntelligenceService } from './ai-intelligence.service';

@Module({
  controllers: [AiIntelligenceController],
  providers: [AiIntelligenceService],
})
export class AiIntelligenceModule {}
