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
let RecruitmentModule = class RecruitmentModule {
};
exports.RecruitmentModule = RecruitmentModule;
exports.RecruitmentModule = RecruitmentModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            job_openings_controller_1.JobOpeningsController,
            candidates_controller_1.CandidatesController,
            manpower_plans_controller_1.ManpowerPlansController,
            manpower_requisitions_controller_1.ManpowerRequisitionsController,
        ],
        providers: [
            job_openings_service_1.JobOpeningsService,
            candidates_service_1.CandidatesService,
            manpower_plans_service_1.ManpowerPlansService,
            manpower_requisitions_service_1.ManpowerRequisitionsService,
        ],
        exports: [
            job_openings_service_1.JobOpeningsService,
            candidates_service_1.CandidatesService,
            manpower_plans_service_1.ManpowerPlansService,
            manpower_requisitions_service_1.ManpowerRequisitionsService,
        ],
    })
], RecruitmentModule);
//# sourceMappingURL=recruitment.module.js.map