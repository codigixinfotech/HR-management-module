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
exports.UpdateComplianceTaskStatusDto = exports.CreateComplianceTaskDto = exports.ListComplianceTasksQueryDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
const pagination_dto_1 = require("../../../common/dto/pagination.dto");
class ListComplianceTasksQueryDto extends pagination_dto_1.PaginationQueryDto {
    companyId;
    status;
}
exports.ListComplianceTasksQueryDto = ListComplianceTasksQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListComplianceTasksQueryDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ComplianceStatus),
    __metadata("design:type", String)
], ListComplianceTasksQueryDto.prototype, "status", void 0);
class CreateComplianceTaskDto {
    companyId;
    complianceTypeId;
    periodLabel;
    dueDate;
}
exports.CreateComplianceTaskDto = CreateComplianceTaskDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComplianceTaskDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComplianceTaskDto.prototype, "complianceTypeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComplianceTaskDto.prototype, "periodLabel", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateComplianceTaskDto.prototype, "dueDate", void 0);
class UpdateComplianceTaskStatusDto {
    status;
    filedDate;
    filedById;
    remarks;
}
exports.UpdateComplianceTaskStatusDto = UpdateComplianceTaskStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.ComplianceStatus),
    __metadata("design:type", String)
], UpdateComplianceTaskStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateComplianceTaskStatusDto.prototype, "filedDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateComplianceTaskStatusDto.prototype, "filedById", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateComplianceTaskStatusDto.prototype, "remarks", void 0);
//# sourceMappingURL=compliance-task.dto.js.map