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
import { TeamsChatService } from './teams/teams-chat.service';
import { TeamsChatController } from './teams/teams-chat.controller';
import { TeamsLinkPoolService } from './teams/teams-link-pool.service';
import { TeamsLinkPoolController } from './teams/teams-link-pool.controller';

@Module({
  imports: [AtsModule],
  controllers: [
    JobOpeningsController,
    CandidatesController,
    ManpowerPlansController,
    ManpowerRequisitionsController,
    InterviewsController,
    OffersController,
    TeamsChatController,
    TeamsLinkPoolController,
  ],
  providers: [
    JobOpeningsService,
    CandidatesService,
    ManpowerPlansService,
    ManpowerRequisitionsService,
    InterviewsService,
    OfferEmailService,
    TeamsInterviewService,
    TeamsChatService,
    TeamsLinkPoolService,
  ],
  exports: [
    JobOpeningsService,
    CandidatesService,
    ManpowerPlansService,
    ManpowerRequisitionsService,
    InterviewsService,
    OfferEmailService,
    TeamsInterviewService,
    TeamsChatService,
    TeamsLinkPoolService,
    AtsModule,
  ],
})
export class RecruitmentModule {}
