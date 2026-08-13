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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveFnfSettlementDto = exports.SaveExitInterviewDto = exports.UpdateClearanceItemDto = exports.AdjustLwdDto = exports.UpdateExitStatusDto = exports.CreateExitDto = void 0;
const class_validator_1 = require("class-validator");
class CreateExitDto {
    employeeId;
    resignationDate;
    noticePeriodDays;
    lastWorkingDay;
    exitType;
    exitReason;
    resignationLetterUrl;
    remarks;
    companyId;
}
exports.CreateExitDto = CreateExitDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExitDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExitDto.prototype, "resignationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateExitDto.prototype, "noticePeriodDays", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExitDto.prototype, "lastWorkingDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExitDto.prototype, "exitType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExitDto.prototype, "exitReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExitDto.prototype, "resignationLetterUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExitDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateExitDto.prototype, "companyId", void 0);
class UpdateExitStatusDto {
    status;
    remarks;
    performedBy;
}
exports.UpdateExitStatusDto = UpdateExitStatusDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateExitStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateExitStatusDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateExitStatusDto.prototype, "performedBy", void 0);
class AdjustLwdDto {
    adjustedLwd;
    reason;
    performedBy;
}
exports.AdjustLwdDto = AdjustLwdDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AdjustLwdDto.prototype, "adjustedLwd", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdjustLwdDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdjustLwdDto.prototype, "performedBy", void 0);
class UpdateClearanceItemDto {
    status;
    remarks;
    verifiedBy;
}
exports.UpdateClearanceItemDto = UpdateClearanceItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateClearanceItemDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateClearanceItemDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateClearanceItemDto.prototype, "verifiedBy", void 0);
class SaveExitInterviewDto {
    primaryReason;
    secondaryReason;
    managerFeedback;
    employeeFeedback;
    workEnvironmentRating;
    compensationRating;
    recommendCompany;
    rehireEligible;
    hrRemarks;
}
exports.SaveExitInterviewDto = SaveExitInterviewDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveExitInterviewDto.prototype, "primaryReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveExitInterviewDto.prototype, "secondaryReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveExitInterviewDto.prototype, "managerFeedback", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveExitInterviewDto.prototype, "employeeFeedback", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SaveExitInterviewDto.prototype, "workEnvironmentRating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SaveExitInterviewDto.prototype, "compensationRating", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveExitInterviewDto.prototype, "recommendCompany", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveExitInterviewDto.prototype, "rehireEligible", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveExitInterviewDto.prototype, "hrRemarks", void 0);
class SaveFnfSettlementDto {
    salaryPayable;
    leaveEncashment;
    incentives;
    reimbursements;
    noticeRecovery;
    loanAdvanceRecovery;
    assetRecovery;
    otherDeductions;
    status;
    remarks;
    approvedBy;
}
exports.SaveFnfSettlementDto = SaveFnfSettlementDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveFnfSettlementDto.prototype, "salaryPayable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveFnfSettlementDto.prototype, "leaveEncashment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveFnfSettlementDto.prototype, "incentives", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveFnfSettlementDto.prototype, "reimbursements", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveFnfSettlementDto.prototype, "noticeRecovery", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveFnfSettlementDto.prototype, "loanAdvanceRecovery", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveFnfSettlementDto.prototype, "assetRecovery", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveFnfSettlementDto.prototype, "otherDeductions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveFnfSettlementDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveFnfSettlementDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveFnfSettlementDto.prototype, "approvedBy", void 0);
//# sourceMappingURL=exit.dto.js.map