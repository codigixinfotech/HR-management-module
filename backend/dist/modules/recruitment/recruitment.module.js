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
let RecruitmentModule = class RecruitmentModule {
};
exports.RecruitmentModule = RecruitmentModule;
exports.RecruitmentModule = RecruitmentModule = __decorate([
    (0, common_1.Module)({
        controllers: [job_openings_controller_1.JobOpeningsController, candidates_controller_1.CandidatesController],
        providers: [job_openings_service_1.JobOpeningsService, candidates_service_1.CandidatesService],
        exports: [job_openings_service_1.JobOpeningsService, candidates_service_1.CandidatesService],
    })
], RecruitmentModule);
//# sourceMappingURL=recruitment.module.js.map