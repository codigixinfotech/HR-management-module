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
exports.CompleteAssetMaintenanceDto = exports.CreateAssetMaintenanceDto = void 0;
const class_validator_1 = require("class-validator");
class CreateAssetMaintenanceDto {
    assetId;
    issue;
    priority;
    maintenanceType;
    vendor;
    warrantyClaim;
    startDate;
    cost;
    notes;
}
exports.CreateAssetMaintenanceDto = CreateAssetMaintenanceDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Asset is required.' }),
    __metadata("design:type", String)
], CreateAssetMaintenanceDto.prototype, "assetId", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Issue / Problem is required.' }),
    __metadata("design:type", String)
], CreateAssetMaintenanceDto.prototype, "issue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetMaintenanceDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetMaintenanceDto.prototype, "maintenanceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetMaintenanceDto.prototype, "vendor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAssetMaintenanceDto.prototype, "warrantyClaim", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Start Date is required.' }),
    __metadata("design:type", String)
], CreateAssetMaintenanceDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAssetMaintenanceDto.prototype, "cost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Remarks cannot exceed 500 characters.' }),
    __metadata("design:type", String)
], CreateAssetMaintenanceDto.prototype, "notes", void 0);
class CompleteAssetMaintenanceDto {
    completionDate;
    finalCondition;
    actualCost;
    vendor;
    workPerformed;
    partsUsed;
    qcStatus;
    repairNotes;
}
exports.CompleteAssetMaintenanceDto = CompleteAssetMaintenanceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Completion Date is invalid.' }),
    __metadata("design:type", String)
], CompleteAssetMaintenanceDto.prototype, "completionDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Final Condition is required.' }),
    __metadata("design:type", String)
], CompleteAssetMaintenanceDto.prototype, "finalCondition", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CompleteAssetMaintenanceDto.prototype, "actualCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteAssetMaintenanceDto.prototype, "vendor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteAssetMaintenanceDto.prototype, "workPerformed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteAssetMaintenanceDto.prototype, "partsUsed", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteAssetMaintenanceDto.prototype, "qcStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Repair notes cannot exceed 500 characters.' }),
    __metadata("design:type", String)
], CompleteAssetMaintenanceDto.prototype, "repairNotes", void 0);
//# sourceMappingURL=asset-maintenance.dto.js.map