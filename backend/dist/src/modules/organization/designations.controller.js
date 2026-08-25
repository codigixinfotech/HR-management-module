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
exports.DesignationsController = void 0;
const common_1 = require("@nestjs/common");
const designations_service_1 = require("./designations.service");
const designation_dto_1 = require("./dto/designation.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let DesignationsController = class DesignationsController {
    designationsService;
    constructor(designationsService) {
        this.designationsService = designationsService;
    }
    list(companyId, departmentId) {
        return this.designationsService.list(companyId, departmentId);
    }
    findOne(id) {
        return this.designationsService.findById(id);
    }
    create(dto) {
        return this.designationsService.create(dto);
    }
    update(id, dto) {
        return this.designationsService.update(id, dto);
    }
    remove(id) {
        return this.designationsService.remove(id);
    }
};
exports.DesignationsController = DesignationsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('organization.designations.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('departmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DesignationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('organization.designations.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DesignationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('organization.designations.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [designation_dto_1.CreateDesignationDto]),
    __metadata("design:returntype", void 0)
], DesignationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('organization.designations.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, designation_dto_1.UpdateDesignationDto]),
    __metadata("design:returntype", void 0)
], DesignationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('organization.designations.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], DesignationsController.prototype, "remove", null);
exports.DesignationsController = DesignationsController = __decorate([
    (0, common_1.Controller)('organization/designations'),
    __metadata("design:paramtypes", [designations_service_1.DesignationsService])
], DesignationsController);
//# sourceMappingURL=designations.controller.js.map