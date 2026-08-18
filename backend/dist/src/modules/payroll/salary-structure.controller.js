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
exports.SalaryStructureController = void 0;
const common_1 = require("@nestjs/common");
const salary_structure_service_1 = require("./salary-structure.service");
const employee_salary_component_dto_1 = require("./dto/employee-salary-component.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let SalaryStructureController = class SalaryStructureController {
    salaryStructureService;
    constructor(salaryStructureService) {
        this.salaryStructureService = salaryStructureService;
    }
    list(employeeId) {
        return this.salaryStructureService.list(employeeId);
    }
    assign(dto) {
        return this.salaryStructureService.assign(dto);
    }
    remove(id) {
        return this.salaryStructureService.remove(id);
    }
};
exports.SalaryStructureController = SalaryStructureController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('payroll.read'),
    __param(0, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalaryStructureController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('payroll.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_salary_component_dto_1.AssignSalaryComponentDto]),
    __metadata("design:returntype", void 0)
], SalaryStructureController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('payroll.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalaryStructureController.prototype, "remove", null);
exports.SalaryStructureController = SalaryStructureController = __decorate([
    (0, common_1.Controller)('payroll/salary-structure'),
    __metadata("design:paramtypes", [salary_structure_service_1.SalaryStructureService])
], SalaryStructureController);
//# sourceMappingURL=salary-structure.controller.js.map