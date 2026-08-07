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
exports.UpdateSalaryComponentDto = exports.CreateSalaryComponentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateSalaryComponentDto {
    companyId;
    code;
    name;
    type;
    isStatutory;
    isActive;
}
exports.CreateSalaryComponentDto = CreateSalaryComponentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.SalaryComponentType),
    __metadata("design:type", String)
], CreateSalaryComponentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSalaryComponentDto.prototype, "isStatutory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSalaryComponentDto.prototype, "isActive", void 0);
class UpdateSalaryComponentDto extends (0, mapped_types_1.PartialType)(CreateSalaryComponentDto) {
}
exports.UpdateSalaryComponentDto = UpdateSalaryComponentDto;
//# sourceMappingURL=salary-component.dto.js.map