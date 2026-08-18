import { Module } from '@nestjs/common';
import { JobOpeningsController } from './job-openings.controller';
import { JobOpeningsService } from './job-openings.service';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { ManpowerPlansController } from './manpower-plans.controller';
import { ManpowerPlansService } from './manpower-plans.service';
import { ManpowerRequisitionsController } from './manpower-requisitions.controller';
import { ManpowerRequisitionsService } from './manpower-requisitions.service';

@Module({
  controllers: [
    JobOpeningsController,
    CandidatesController,
    ManpowerPlansController,
    ManpowerRequisitionsController,
  ],
  providers: [
    JobOpeningsService,
    CandidatesService,
    ManpowerPlansService,
    ManpowerRequisitionsService,
  ],
  exports: [
    JobOpeningsService,
    CandidatesService,
    ManpowerPlansService,
    ManpowerRequisitionsService,
  ],
})
export class RecruitmentModule {}
