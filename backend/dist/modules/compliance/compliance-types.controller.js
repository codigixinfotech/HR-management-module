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
exports.ComplianceTypesController = void 0;
const common_1 = require("@nestjs/common");
const compliance_types_service_1 = require("./compliance-types.service");
const compliance_type_dto_1 = require("./dto/compliance-type.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ComplianceTypesController = class ComplianceTypesController {
    complianceTypesService;
    constructor(complianceTypesService) {
        this.complianceTypesService = complianceTypesService;
    }
    list(companyId) {
        return this.complianceTypesService.list(companyId);
    }
    findOne(id) {
        return this.complianceTypesService.findById(id);
    }
    create(dto) {
        return this.complianceTypesService.create(dto);
    }
    update(id, dto) {
        return this.complianceTypesService.update(id, dto);
    }
    remove(id) {
        return this.complianceTypesService.remove(id);
    }
};
exports.ComplianceTypesController = ComplianceTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('compliance.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComplianceTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('compliance.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComplianceTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('compliance.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [compliance_type_dto_1.CreateComplianceTypeDto]),
    __metadata("design:returntype", void 0)
], ComplianceTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('compliance.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, compliance_type_dto_1.UpdateComplianceTypeDto]),
    __metadata("design:returntype", void 0)
], ComplianceTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('compliance.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ComplianceTypesController.prototype, "remove", null);
exports.ComplianceTypesController = ComplianceTypesController = __decorate([
    (0, common_1.Controller)('compliance/types'),
    __metadata("design:paramtypes", [compliance_types_service_1.ComplianceTypesService])
], ComplianceTypesController);
//# sourceMappingURL=compliance-types.controller.js.map