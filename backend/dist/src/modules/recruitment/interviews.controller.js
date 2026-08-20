"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewsController = void 0;
const common_1 = require("@nestjs/common");
const interviews_service_1 = require("./interviews.service");
const interview_dto_1 = require("./dto/interview.dto");
let InterviewsController = class InterviewsController {
    interviewsService;
    constructor(interviewsService) {
        this.interviewsService = interviewsService;
    }
    create(dto) {
        return this.interviewsService.createInterview(dto);
    }
    list(interviewerId, candidateId, status, filterTab, search) {
        return this.interviewsService.listInterviews({
            interviewerId,
            candidateId,
            status,
            filterTab,
            search,
        });
    }
    getDashboardSummary() {
        return this.interviewsService.getDashboardSummary();
    }
    getCandidateInterviewHistory(candidateId) {
        return this.interviewsService.getCandidateInterviewHistory(candidateId);
    }
    getReminders(interviewerId) {
        return this.interviewsService.getPanelReminders(interviewerId);
    }
    findOne(id) {
        return this.interviewsService.getInterviewById(id);
    }
    updateSchedule(id, dto) {
        return this.interviewsService.updateSchedule(id, dto);
    }
    updateStatus(id, dto) {
        return this.interviewsService.updateStatus(id, dto);
    }
    submitEvaluation(id, dto) {
        return this.interviewsService.submitEvaluation(id, dto);
    }
};
exports.InterviewsController = InterviewsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [interview_dto_1.CreateInterviewDto]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('interviewerId')),
    __param(1, (0, common_1.Query)('candidateId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('filterTab')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('dashboard-summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('candidate/:candidateId/history'),
    __param(0, (0, common_1.Param)('candidateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "getCandidateInterviewHistory", null);
__decorate([
    (0, common_1.Get)('reminders/my'),
    __param(0, (0, common_1.Query)('interviewerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "getReminders", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/schedule'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, interview_dto_1.UpdateInterviewScheduleDto]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "updateSchedule", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, interview_dto_1.UpdateInterviewStatusDto]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/evaluations'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, interview_dto_1.SubmitEvaluationDto]),
    __metadata("design:returntype", void 0)
], InterviewsController.prototype, "submitEvaluation", null);
exports.InterviewsController = InterviewsController = __decorate([
    (0, common_1.Controller)('recruitment/interviews'),
    __metadata("design:paramtypes", [interviews_service_1.InterviewsService])
], InterviewsController);
//# sourceMappingURL=interviews.controller.js.map