import { Module } from '@nestjs/common';
import { JobOpeningsController } from './job-openings.controller';
import { JobOpeningsService } from './job-openings.service';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';

@Module({
  controllers: [JobOpeningsController, CandidatesController],
  providers: [JobOpeningsService, CandidatesService],
  exports: [JobOpeningsService, CandidatesService],
})
export class RecruitmentModule {}
