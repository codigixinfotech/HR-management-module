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
exports.CompensationBenefitsController = void 0;
const common_1 = require("@nestjs/common");
const compensation_benefits_service_1 = require("./compensation-benefits.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let CompensationBenefitsController = class CompensationBenefitsController {
    compensationBenefitsService;
    constructor(compensationBenefitsService) {
        this.compensationBenefitsService = compensationBenefitsService;
    }
    getStatus() {
        return this.compensationBenefitsService.getStatus();
    }
};
exports.CompensationBenefitsController = CompensationBenefitsController;
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.Permissions)('compensation_benefits.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompensationBenefitsController.prototype, "getStatus", null);
exports.CompensationBenefitsController = CompensationBenefitsController = __decorate([
    (0, common_1.Controller)('compensation-benefits'),
    __metadata("design:paramtypes", [compensation_benefits_service_1.CompensationBenefitsService])
], CompensationBenefitsController);
//# sourceMappingURL=compensation-benefits.controller.js.map