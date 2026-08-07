"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationModule = void 0;
const common_1 = require("@nestjs/common");
const companies_controller_1 = require("./companies.controller");
const companies_service_1 = require("./companies.service");
const branches_controller_1 = require("./branches.controller");
const branches_service_1 = require("./branches.service");
const departments_controller_1 = require("./departments.controller");
const departments_service_1 = require("./departments.service");
const designations_controller_1 = require("./designations.controller");
const designations_service_1 = require("./designations.service");
let OrganizationModule = class OrganizationModule {
};
exports.OrganizationModule = OrganizationModule;
exports.OrganizationModule = OrganizationModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            companies_controller_1.CompaniesController,
            branches_controller_1.BranchesController,
            departments_controller_1.DepartmentsController,
            designations_controller_1.DesignationsController,
        ],
        providers: [
            companies_service_1.CompaniesService,
            branches_service_1.BranchesService,
            departments_service_1.DepartmentsService,
            designations_service_1.DesignationsService,
        ],
        exports: [
            companies_service_1.CompaniesService,
            branches_service_1.BranchesService,
            departments_service_1.DepartmentsService,
            designations_service_1.DesignationsService,
        ],
    })
], OrganizationModule);
//# sourceMappingURL=organization.module.js.map