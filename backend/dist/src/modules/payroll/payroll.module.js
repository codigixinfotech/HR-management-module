"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrollModule = void 0;
const common_1 = require("@nestjs/common");
const salary_components_controller_1 = require("./salary-components.controller");
const salary_components_service_1 = require("./salary-components.service");
const salary_structure_controller_1 = require("./salary-structure.controller");
const salary_structure_service_1 = require("./salary-structure.service");
const payroll_runs_controller_1 = require("./payroll-runs.controller");
const payroll_runs_service_1 = require("./payroll-runs.service");
const payslips_controller_1 = require("./payslips.controller");
const payslips_service_1 = require("./payslips.service");
let PayrollModule = class PayrollModule {
};
exports.PayrollModule = PayrollModule;
exports.PayrollModule = PayrollModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            salary_components_controller_1.SalaryComponentsController,
            salary_structure_controller_1.SalaryStructureController,
            payroll_runs_controller_1.PayrollRunsController,
            payslips_controller_1.PayslipsController,
        ],
        providers: [
            salary_components_service_1.SalaryComponentsService,
            salary_structure_service_1.SalaryStructureService,
            payroll_runs_service_1.PayrollRunsService,
            payslips_service_1.PayslipsService,
        ],
        exports: [
            salary_components_service_1.SalaryComponentsService,
            salary_structure_service_1.SalaryStructureService,
            payroll_runs_service_1.PayrollRunsService,
            payslips_service_1.PayslipsService,
        ],
    })
], PayrollModule);
//# sourceMappingURL=payroll.module.js.map