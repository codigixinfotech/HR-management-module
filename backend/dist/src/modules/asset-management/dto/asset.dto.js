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
exports.ReturnAssetDto = exports.AllocateAssetDto = exports.UpdateAssetDto = exports.CreateAssetDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
class CreateAssetDto {
    companyId;
    assetTag;
    name;
    category;
    assetType;
    branchId;
    departmentId;
    physicalLocation;
    vendor;
    invoiceNumber;
    poNumber;
    serialNumber;
    manufacturer;
    modelNumber;
    value;
    purchaseDate;
    warrantyStart;
    warrantyExpiry;
    status;
    condition;
    usefulLife;
    notes;
    remarks;
    photoUrl;
}
exports.CreateAssetDto = CreateAssetDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Company / Entity is required.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "assetTag", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Asset Name is required.' }),
    (0, class_validator_1.MinLength)(3, { message: 'Asset Name must be between 3 and 100 characters.' }),
    (0, class_validator_1.MaxLength)(100, { message: 'Asset Name must be between 3 and 100 characters.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Asset Category is required.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Asset Type is required.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "assetType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Branch / Location is required.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Department is required.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "departmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200, { message: 'Physical Location cannot exceed 200 characters.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "physicalLocation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "vendor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "poNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "serialNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "manufacturer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "modelNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Please enter a valid purchase cost.' }),
    (0, class_validator_1.Min)(0.01, { message: 'Purchase Cost must be greater than 0.' }),
    __metadata("design:type", Number)
], CreateAssetDto.prototype, "value", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Purchase Date is required.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "purchaseDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Warranty Start Date is invalid.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "warrantyStart", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Warranty End Date is invalid.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "warrantyExpiry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Asset Status is required.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Asset Condition is required.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "condition", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "usefulLife", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Description cannot exceed 500 characters.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Remarks cannot exceed 500 characters.' }),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAssetDto.prototype, "photoUrl", void 0);
class UpdateAssetDto extends (0, mapped_types_1.PartialType)(CreateAssetDto) {
}
exports.UpdateAssetDto = UpdateAssetDto;
class AllocateAssetDto {
    employeeId;
    allocationDate;
    allocationType;
    location;
    expectedReturnDate;
    remarks;
}
exports.AllocateAssetDto = AllocateAssetDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Employee is required.' }),
    __metadata("design:type", String)
], AllocateAssetDto.prototype, "employeeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Allocation Date is invalid.' }),
    __metadata("design:type", String)
], AllocateAssetDto.prototype, "allocationDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllocateAssetDto.prototype, "allocationType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllocateAssetDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Expected Return Date is invalid.' }),
    __metadata("design:type", String)
], AllocateAssetDto.prototype, "expectedReturnDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Remarks cannot exceed 500 characters.' }),
    __metadata("design:type", String)
], AllocateAssetDto.prototype, "remarks", void 0);
class ReturnAssetDto {
    returnDate;
    returnReason;
    otherReason;
    returnedBy;
    returnLocation;
    condition;
    accessoriesReturned;
    remarks;
}
exports.ReturnAssetDto = ReturnAssetDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Return Date is invalid.' }),
    __metadata("design:type", String)
], ReturnAssetDto.prototype, "returnDate", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Return Reason is required.' }),
    __metadata("design:type", String)
], ReturnAssetDto.prototype, "returnReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnAssetDto.prototype, "otherReason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnAssetDto.prototype, "returnedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnAssetDto.prototype, "returnLocation", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Asset Condition is required.' }),
    __metadata("design:type", String)
], ReturnAssetDto.prototype, "condition", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReturnAssetDto.prototype, "accessoriesReturned", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500, { message: 'Remarks cannot exceed 500 characters.' }),
    __metadata("design:type", String)
], ReturnAssetDto.prototype, "remarks", void 0);
//# sourceMappingURL=asset.dto.js.map