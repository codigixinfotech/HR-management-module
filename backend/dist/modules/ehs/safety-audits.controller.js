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
exports.SafetyAuditsController = void 0;
const common_1 = require("@nestjs/common");
const safety_audits_service_1 = require("./safety-audits.service");
const safety_audit_dto_1 = require("./dto/safety-audit.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let SafetyAuditsController = class SafetyAuditsController {
    safetyAuditsService;
    constructor(safetyAuditsService) {
        this.safetyAuditsService = safetyAuditsService;
    }
    list(companyId) {
        return this.safetyAuditsService.list(companyId);
    }
    create(dto) {
        return this.safetyAuditsService.create(dto);
    }
};
exports.SafetyAuditsController = SafetyAuditsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('ehs.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SafetyAuditsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('ehs.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [safety_audit_dto_1.CreateSafetyAuditDto]),
    __metadata("design:returntype", void 0)
], SafetyAuditsController.prototype, "create", null);
exports.SafetyAuditsController = SafetyAuditsController = __decorate([
    (0, common_1.Controller)('ehs/audits'),
    __metadata("design:paramtypes", [safety_audits_service_1.SafetyAuditsService])
], SafetyAuditsController);
//# sourceMappingURL=safety-audits.controller.js.map