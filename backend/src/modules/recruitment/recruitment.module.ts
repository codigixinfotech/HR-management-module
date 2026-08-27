import { Module } from '@nestjs/common';
import { JobOpeningsController } from './job-openings.controller';
import { JobOpeningsService } from './job-openings.service';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { ManpowerPlansController } from './manpower-plans.controller';
import { ManpowerPlansService } from './manpower-plans.service';
import { ManpowerRequisitionsController } from './manpower-requisitions.controller';
import { ManpowerRequisitionsService } from './manpower-requisitions.service';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { OffersController } from './offers.controller';
import { OfferEmailService } from './offer-email.service';
import { AtsModule } from './ats/ats.module';
import { TeamsInterviewService } from './teams/teams-interview.service';

@Module({
  imports: [AtsModule],
  controllers: [
    JobOpeningsController,
    CandidatesController,
    ManpowerPlansController,
    ManpowerRequisitionsController,
    InterviewsController,
    OffersController,
  ],
  providers: [
    JobOpeningsService,
    CandidatesService,
    ManpowerPlansService,
    ManpowerRequisitionsService,
    InterviewsService,
    OfferEmailService,
    TeamsInterviewService,
  ],
  exports: [
    JobOpeningsService,
    CandidatesService,
    ManpowerPlansService,
    ManpowerRequisitionsService,
    InterviewsService,
    OfferEmailService,
    TeamsInterviewService,
    AtsModule,
  ],
})
export class RecruitmentModule {}
