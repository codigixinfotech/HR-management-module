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
exports.ExitsController = void 0;
const common_1 = require("@nestjs/common");
const exits_service_1 = require("./exits.service");
const exit_dto_1 = require("./dto/exit.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ExitsController = class ExitsController {
    service;
    constructor(service) {
        this.service = service;
    }
    getKpis(companyId) {
        return this.service.getKpis(companyId);
    }
    findAll(search, status, companyId) {
        return this.service.findAll(search, status, companyId);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(dto) {
        return this.service.create(dto);
    }
    updateStatus(id, dto) {
        return this.service.updateStatus(id, dto);
    }
    adjustLwd(id, dto) {
        return this.service.adjustLwd(id, dto);
    }
    updateClearanceItem(itemId, dto) {
        return this.service.updateClearanceItem(itemId, dto);
    }
    saveExitInterview(id, dto) {
        return this.service.saveExitInterview(id, dto);
    }
    saveFnfSettlement(id, dto) {
        return this.service.saveFnfSettlement(id, dto);
    }
    completeExit(id, performedBy) {
        return this.service.completeExit(id, performedBy);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.ExitsController = ExitsController;
__decorate([
    (0, common_1.Get)('kpis'),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "getKpis", null);
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exit_dto_1.CreateExitDto]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exit_dto_1.UpdateExitStatusDto]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/adjust-lwd'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exit_dto_1.AdjustLwdDto]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "adjustLwd", null);
__decorate([
    (0, common_1.Patch)('clearance/:itemId'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exit_dto_1.UpdateClearanceItemDto]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "updateClearanceItem", null);
__decorate([
    (0, common_1.Post)(':id/exit-interview'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exit_dto_1.SaveExitInterviewDto]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "saveExitInterview", null);
__decorate([
    (0, common_1.Post)(':id/fnf'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exit_dto_1.SaveFnfSettlementDto]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "saveFnfSettlement", null);
__decorate([
    (0, common_1.Post)(':id/complete-exit'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('performedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "completeExit", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExitsController.prototype, "remove", null);
exports.ExitsController = ExitsController = __decorate([
    (0, common_1.Controller)('employees/exits'),
    __metadata("design:paramtypes", [exits_service_1.ExitsService])
], ExitsController);
//# sourceMappingURL=exits.controller.js.map