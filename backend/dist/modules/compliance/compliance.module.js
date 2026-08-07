"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceModule = void 0;
const common_1 = require("@nestjs/common");
const compliance_types_controller_1 = require("./compliance-types.controller");
const compliance_types_service_1 = require("./compliance-types.service");
const compliance_tasks_controller_1 = require("./compliance-tasks.controller");
const compliance_tasks_service_1 = require("./compliance-tasks.service");
let ComplianceModule = class ComplianceModule {
};
exports.ComplianceModule = ComplianceModule;
exports.ComplianceModule = ComplianceModule = __decorate([
    (0, common_1.Module)({
        controllers: [compliance_types_controller_1.ComplianceTypesController, compliance_tasks_controller_1.ComplianceTasksController],
        providers: [compliance_types_service_1.ComplianceTypesService, compliance_tasks_service_1.ComplianceTasksService],
        exports: [compliance_types_service_1.ComplianceTypesService, compliance_tasks_service_1.ComplianceTasksService],
    })
], ComplianceModule);
//# sourceMappingURL=compliance.module.js.map