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
exports.PpeController = void 0;
const common_1 = require("@nestjs/common");
const ppe_service_1 = require("./ppe.service");
const ppe_dto_1 = require("./dto/ppe.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let PpeController = class PpeController {
    ppeService;
    constructor(ppeService) {
        this.ppeService = ppeService;
    }
    list(companyId) {
        return this.ppeService.list(companyId);
    }
    listIssuances(ppeItemId) {
        return this.ppeService.listIssuances(ppeItemId);
    }
    create(dto) {
        return this.ppeService.create(dto);
    }
    update(id, dto) {
        return this.ppeService.update(id, dto);
    }
    remove(id) {
        return this.ppeService.remove(id);
    }
    issue(id, dto) {
        return this.ppeService.issue(id, dto);
    }
};
exports.PpeController = PpeController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('ehs.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PpeController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('issuances'),
    (0, permissions_decorator_1.Permissions)('ehs.read'),
    __param(0, (0, common_1.Query)('ppeItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PpeController.prototype, "listIssuances", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('ehs.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ppe_dto_1.CreatePpeItemDto]),
    __metadata("design:returntype", void 0)
], PpeController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('ehs.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ppe_dto_1.UpdatePpeItemDto]),
    __metadata("design:returntype", void 0)
], PpeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('ehs.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PpeController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/issue'),
    (0, permissions_decorator_1.Permissions)('ehs.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ppe_dto_1.IssuePpeDto]),
    __metadata("design:returntype", void 0)
], PpeController.prototype, "issue", null);
exports.PpeController = PpeController = __decorate([
    (0, common_1.Controller)('ehs/ppe'),
    __metadata("design:paramtypes", [ppe_service_1.PpeService])
], PpeController);
//# sourceMappingURL=ppe.controller.js.map