"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentModule = void 0;
const common_1 = require("@nestjs/common");
const job_openings_controller_1 = require("./job-openings.controller");
const job_openings_service_1 = require("./job-openings.service");
const candidates_controller_1 = require("./candidates.controller");
const candidates_service_1 = require("./candidates.service");
const manpower_plans_controller_1 = require("./manpower-plans.controller");
const manpower_plans_service_1 = require("./manpower-plans.service");
const manpower_requisitions_controller_1 = require("./manpower-requisitions.controller");
const manpower_requisitions_service_1 = require("./manpower-requisitions.service");
const interviews_controller_1 = require("./interviews.controller");
const interviews_service_1 = require("./interviews.service");
const offers_controller_1 = require("./offers.controller");
const offer_email_service_1 = require("./offer-email.service");
const ats_module_1 = require("./ats/ats.module");
const teams_interview_service_1 = require("./teams/teams-interview.service");
const teams_chat_service_1 = require("./teams/teams-chat.service");
const teams_chat_controller_1 = require("./teams/teams-chat.controller");
let RecruitmentModule = class RecruitmentModule {
};
exports.RecruitmentModule = RecruitmentModule;
exports.RecruitmentModule = RecruitmentModule = __decorate([
    (0, common_1.Module)({
        imports: [ats_module_1.AtsModule],
        controllers: [
            job_openings_controller_1.JobOpeningsController,
            candidates_controller_1.CandidatesController,
            manpower_plans_controller_1.ManpowerPlansController,
            manpower_requisitions_controller_1.ManpowerRequisitionsController,
            interviews_controller_1.InterviewsController,
            offers_controller_1.OffersController,
            teams_chat_controller_1.TeamsChatController,
        ],
        providers: [
            job_openings_service_1.JobOpeningsService,
            candidates_service_1.CandidatesService,
            manpower_plans_service_1.ManpowerPlansService,
            manpower_requisitions_service_1.ManpowerRequisitionsService,
            interviews_service_1.InterviewsService,
            offer_email_service_1.OfferEmailService,
            teams_interview_service_1.TeamsInterviewService,
            teams_chat_service_1.TeamsChatService,
        ],
        exports: [
            job_openings_service_1.JobOpeningsService,
            candidates_service_1.CandidatesService,
            manpower_plans_service_1.ManpowerPlansService,
            manpower_requisitions_service_1.ManpowerRequisitionsService,
            interviews_service_1.InterviewsService,
            offer_email_service_1.OfferEmailService,
            teams_interview_service_1.TeamsInterviewService,
            teams_chat_service_1.TeamsChatService,
            ats_module_1.AtsModule,
        ],
    })
], RecruitmentModule);
//# sourceMappingURL=recruitment.module.js.map