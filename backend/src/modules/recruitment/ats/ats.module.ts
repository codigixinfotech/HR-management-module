import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { AtsController } from './ats.controller';
import { AtsService } from './ats.service';
import { ResumeParserService } from './resume-parser.service';
import { SkillMatchingService } from './skill-matching.service';
import { ExperienceMatchingService } from './experience-matching.service';

@Module({
  imports: [PrismaModule],
  controllers: [AtsController],
  providers: [
    AtsService,
    ResumeParserService,
    SkillMatchingService,
    ExperienceMatchingService,
  ],
  exports: [AtsService],
})
export class AtsModule {}
