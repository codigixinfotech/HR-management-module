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
exports.UpdateAttendanceDto = exports.MarkAttendanceDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class MarkAttendanceDto {
    companyId;
    employeeId;
    date;
    employeeCode;
    employeeName;
    departmentName;
    status;
    checkIn;
    checkOut;
    remarks;
    faceVerificationStatus;
    faceMatchScore;
    ipAddress;
    ipVerificationStatus;
    latitude;
    longitude;
    locationVerificationStatus;
    deviceType;
    capturedFacePhoto;
    officeLocation;
    distanceMeters;
    allowedRadiusMeters;
    verificationMethod;
    failureReason;
    punchType;
}
exports.MarkAttendanceDto = MarkAttendanceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "employeeCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "employeeName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "departmentName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.AttendanceStatus),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "checkIn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "checkOut", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "faceVerificationStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MarkAttendanceDto.prototype, "faceMatchScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "ipAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "ipVerificationStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MarkAttendanceDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MarkAttendanceDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "locationVerificationStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "deviceType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "capturedFacePhoto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "officeLocation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MarkAttendanceDto.prototype, "distanceMeters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MarkAttendanceDto.prototype, "allowedRadiusMeters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "verificationMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "failureReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkAttendanceDto.prototype, "punchType", void 0);
class UpdateAttendanceDto extends (0, mapped_types_1.PartialType)(MarkAttendanceDto) {
}
exports.UpdateAttendanceDto = UpdateAttendanceDto;
//# sourceMappingURL=attendance.dto.js.map