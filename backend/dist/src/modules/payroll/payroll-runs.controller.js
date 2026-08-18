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
exports.PayrollRunsController = void 0;
const common_1 = require("@nestjs/common");
const payroll_runs_service_1 = require("./payroll-runs.service");
const payroll_run_dto_1 = require("./dto/payroll-run.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let PayrollRunsController = class PayrollRunsController {
    payrollRunsService;
    constructor(payrollRunsService) {
        this.payrollRunsService = payrollRunsService;
    }
    list(companyId) {
        return this.payrollRunsService.list(companyId);
    }
    findOne(id) {
        return this.payrollRunsService.findById(id);
    }
    create(dto) {
        return this.payrollRunsService.create(dto);
    }
    process(id) {
        return this.payrollRunsService.process(id);
    }
    updateStatus(id, dto) {
        return this.payrollRunsService.updateStatus(id, dto);
    }
};
exports.PayrollRunsController = PayrollRunsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('payroll.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollRunsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('payroll.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollRunsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('payroll.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payroll_run_dto_1.CreatePayrollRunDto]),
    __metadata("design:returntype", void 0)
], PayrollRunsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/process'),
    (0, permissions_decorator_1.Permissions)('payroll.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PayrollRunsController.prototype, "process", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, permissions_decorator_1.Permissions)('payroll.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payroll_run_dto_1.UpdatePayrollRunStatusDto]),
    __metadata("design:returntype", void 0)
], PayrollRunsController.prototype, "updateStatus", null);
exports.PayrollRunsController = PayrollRunsController = __decorate([
    (0, common_1.Controller)('payroll/runs'),
    __metadata("design:paramtypes", [payroll_runs_service_1.PayrollRunsService])
], PayrollRunsController);
//# sourceMappingURL=payroll-runs.controller.js.map